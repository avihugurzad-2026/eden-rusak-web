/* a-digital — work agreements with electronic signature (Vercel function).

   GET  /api/agreement?id=X               → agreement status + signatures (personal data masked)
   GET  /api/agreement?id=X&pdf=1         → the agreement as PDF (current state, for print-and-sign)
   POST /api/agreement {action:"code"}    → e-mails a one-time code to the signer
   POST /api/agreement {action:"sign"}    → verifies the code, stores the signature, e-mails the
                                            signed PDF to every party

   Signature design (Israeli Electronic Signature Law, 2001, "secure signature" criteria):
   unique to the signer and identifies them (name, ID number, verified e-mail), created with a
   means under their sole control (one-time code to their own mailbox, typed name, drawn
   signature, explicit consent), and any change after signing is detectable (SHA-256 of the
   agreement text and of every signature record, stored and printed on the PDF; once one party
   signed, a changed text cannot be signed).

   Storage: Supabase (public.eden_agreements / eden_agreement_signatures / eden_agreement_otps,
   RLS on, no policies — service role only). Mail: Resend, from the edenrusak.com domain.
   Env: LEADS_SUPABASE_URL, LEADS_SUPABASE_SERVICE_KEY, RESEND_API_KEY,
        AGREEMENT_MAIL_FROM (optional), AGREEMENT_BASE_URL (optional), CHROME_PATH (local only). */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const MAIL_FROM = () => process.env.AGREEMENT_MAIL_FROM || "a-digital <agreements@edenrusak.com>";
const CODE_TTL_MIN = 10;
const MAX_CODES_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

/* ---------- helpers ---------- */

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = (v, max = 200) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const isEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
const digits = (s) => String(s ?? "").replace(/\D/g, "");

function validIsraeliId(id) {
  const d = digits(id);
  if (d.length < 5 || d.length > 9) return false;
  const p = d.padStart(9, "0");
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(p[i]) * ((i % 2) + 1);
    sum += n > 9 ? n - 9 : n;
  }
  return sum % 10 === 0;
}

const heDate = (iso) =>
  new Date(iso).toLocaleString("he-IL", {
    timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

const maskEmail = (e) => {
  const [u, d] = String(e || "").split("@");
  if (!d) return "";
  return (u.length <= 2 ? u[0] + "*" : u.slice(0, 2) + "***") + "@" + d;
};
const maskId = (id) => {
  const d = digits(id);
  return d ? "*****" + d.slice(-4) : "";
};

function clientIp(req) {
  return clean(String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0], 64);
}

async function supabase(p, init = {}) {
  const res = await fetch(`${process.env.LEADS_SUPABASE_URL}/rest/v1/${p}`, {
    ...init,
    headers: {
      apikey: process.env.LEADS_SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${process.env.LEADS_SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const err = new Error(`supabase ${res.status}: ${await res.text()}`);
    err.status = res.status;
    throw err;
  }
  const body = await res.text();
  return body ? JSON.parse(body) : null;
}

async function sendMail({ to, subject, html, text, replyTo, attachments }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: MAIL_FROM(),
      to: Array.isArray(to) ? to : [to],
      subject, html, text,
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(attachments ? { attachments } : {}),
    }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`);
  return res.json();
}

/* ---------- agreement text & hash ---------- */

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, "&");
}

/* The binding text is everything between the AGREEMENT-START / AGREEMENT-END markers in the
   page file, as plain text. Its SHA-256 is the document fingerprint. */
function agreementText(agreement) {
  const file = path.join(process.cwd(), agreement.page_path);
  const html = fs.readFileSync(file, "utf8");
  const m = html.match(/<!--\s*AGREEMENT-START\s*-->([\s\S]*?)<!--\s*AGREEMENT-END\s*-->/);
  if (!m) throw new Error("agreement markers missing in " + agreement.page_path);
  const text = decodeEntities(
    m[1]
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(br|\/p|\/li|\/h\d|\/div|\/dd|\/dt)\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .split("\n")
    .map((l) => l.replace(/[ \t ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
  return { text, hash: sha256(text) };
}

/* ---------- render token (lets the PDF renderer see unmasked data) ---------- */

function renderToken(id) {
  const exp = Date.now() + 3 * 60 * 1000;
  const sig = crypto.createHmac("sha256", process.env.LEADS_SUPABASE_SERVICE_KEY).update(`${id}:${exp}`).digest("hex");
  return `${exp}.${sig}`;
}
function validRenderToken(id, t) {
  const [exp, sig] = String(t || "").split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const want = crypto.createHmac("sha256", process.env.LEADS_SUPABASE_SERVICE_KEY).update(`${id}:${exp}`).digest("hex");
  return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want));
}

/* ---------- data ---------- */

async function loadAgreement(id) {
  if (!/^[a-z0-9-]{3,60}$/.test(id || "")) return null;
  const rows = await supabase(`eden_agreements?id=eq.${encodeURIComponent(id)}&active=eq.true&select=*`);
  return rows[0] || null;
}
async function loadSignatures(id) {
  return supabase(`eden_agreement_signatures?agreement_id=eq.${encodeURIComponent(id)}&select=*&order=signed_at.asc`);
}

function publicSignature(s, full) {
  return {
    party: s.party,
    signer_name: s.signer_name,
    signer_role: s.signer_role,
    signer_id_number: full ? s.signer_id_number : maskId(s.signer_id_number),
    signer_email: full ? s.signer_email : maskEmail(s.signer_email),
    details: full ? s.details : maskDetails(s.details),
    signature_png: s.signature_png,
    doc_hash: s.doc_hash,
    signature_hash: s.signature_hash,
    signed_at: s.signed_at,
    signed_at_he: heDate(s.signed_at),
    otp_verified_at_he: heDate(s.otp_verified_at),
    ...(full ? { ip: s.ip } : {}),
  };
}
function maskDetails(d) {
  if (!d) return {};
  const o = { ...d };
  if (o.contact_email) o.contact_email = maskEmail(o.contact_email);
  if (o.contact_phone) o.contact_phone = digits(o.contact_phone).replace(/^(\d{3})\d+(\d{2})$/, "$1-*****$2");
  return o;
}

/* ---------- validation ---------- */

const CLIENT_FIELDS = {
  company_name: [2, 120, "שם החברה"],
  company_reg: [9, 9, "ח.פ."],
  company_address: [4, 200, "כתובת החברה"],
  contact_name: [2, 80, "שם איש הקשר"],
  contact_role: [0, 80, "תפקיד איש הקשר"],
  contact_phone: [9, 20, "טלפון איש הקשר"],
  contact_email: [5, 160, "מייל איש הקשר"],
  billing_email: [0, 160, "מייל לחשבוניות"],
  start_date: [10, 10, "תאריך תחילת העבודה"],
};

function readSigner(b) {
  const s = b.signer || {};
  const signer = {
    name: clean(s.name, 80),
    id_number: digits(s.id_number).slice(0, 9),
    role: clean(s.role, 80),
    email: clean(s.email, 160).toLowerCase(),
  };
  const errors = [];
  if (signer.name.split(" ").filter(Boolean).length < 2) errors.push("signer.name");
  if (!validIsraeliId(signer.id_number)) errors.push("signer.id_number");
  if (signer.role.length < 2) errors.push("signer.role");
  if (!isEmail(signer.email)) errors.push("signer.email");
  return { signer, errors };
}

function readClientDetails(b) {
  const d = {};
  const errors = [];
  const src = b.details || {};
  for (const [k, [min, max]] of Object.entries(CLIENT_FIELDS)) {
    let v = clean(src[k], max);
    if (k === "company_reg" || k === "contact_phone") v = k === "company_reg" ? digits(v) : v.replace(/[^\d+\- ]/g, "");
    if (k.endsWith("email")) v = v.toLowerCase();
    d[k] = v;
    if (v.length < min) errors.push("details." + k);
  }
  if (d.company_reg && d.company_reg.length !== 9) errors.push("details.company_reg");
  if (digits(d.contact_phone).length < 9) errors.push("details.contact_phone");
  if (!isEmail(d.contact_email)) errors.push("details.contact_email");
  if (d.billing_email && !isEmail(d.billing_email)) errors.push("details.billing_email");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.start_date) || isNaN(Date.parse(d.start_date))) errors.push("details.start_date");
  return { details: d, errors: [...new Set(errors)] };
}

/* ---------- PDF ---------- */

function baseUrl() {
  if (process.env.AGREEMENT_BASE_URL) return process.env.AGREEMENT_BASE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production") return "https://edenrusak.com";
  return `https://${process.env.VERCEL_URL}`;
}

async function renderPdf(agreement, { full }) {
  const puppeteer = (await import("puppeteer-core")).default;
  let executablePath = process.env.CHROME_PATH;
  let args = ["--no-sandbox", "--font-render-hinting=none"];
  if (!executablePath) {
    const chromium = (await import("@sparticuz/chromium")).default;
    executablePath = await chromium.executablePath();
    args = chromium.args;
  }
  const browser = await puppeteer.launch({ executablePath, args, headless: true, defaultViewport: { width: 1200, height: 1600 } });
  try {
    const page = await browser.newPage();
    if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET)
      await page.setExtraHTTPHeaders({ "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET });
    const dir = "/" + agreement.page_path.replace(/index\.html$/, "");
    const url = `${baseUrl()}${dir}?pdf=1${full ? "&rt=" + encodeURIComponent(renderToken(agreement.id)) : ""}`;
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForFunction("window.__agreementReady === true", { timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

/* ---------- mails ---------- */

function shell(inner) {
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#fdf9f8;font-family:Arial,Helvetica,sans-serif;color:#1b1d3a">
<div style="max-width:560px;margin:0 auto;padding:28px 16px">
<div style="text-align:center;font-size:24px;font-weight:bold;color:#161b86;margin-bottom:18px" dir="ltr">a-digital</div>
<div style="background:#fff;border-radius:22px;padding:30px 26px;text-align:right;line-height:1.75;font-size:16px;border:1px solid #ece6ea">${inner}</div>
<p style="text-align:center;font-size:12px;color:#7a7a8c;margin-top:16px;line-height:1.6">הודעה אוטומטית ממערכת החתימה של a-digital. אם לא ביקשת את הקוד או אינך צד להסכם, אפשר להתעלם מהודעה זו.</p>
</div></body></html>`;
}

function codeMail(agreement, code) {
  const html = shell(
    `<p style="margin:0 0 12px;font-size:19px;font-weight:bold">קוד אימות לחתימה על ההסכם</p>
     <p style="margin:0 0 12px">הקוד לחתימה על <b>${esc(agreement.title)}</b>:</p>
     <p dir="ltr" style="margin:18px 0;text-align:center;font-size:34px;font-weight:bold;letter-spacing:8px;color:#232dce">${code}</p>
     <p style="margin:0">הקוד תקף ל-${CODE_TTL_MIN} דקות ולשימוש חד-פעמי. אין להעביר אותו לאיש: הזנת הקוד מהווה חלק מהחתימה האלקטרונית שלך.</p>`
  );
  const text = `קוד אימות לחתימה על ${agreement.title}: ${code}\nהקוד תקף ל-${CODE_TTL_MIN} דקות ולשימוש חד-פעמי. אין להעביר אותו לאיש.`;
  return { subject: `קוד אימות לחתימה: ${code}`, html, text };
}

function signedMail(agreement, sigs, latest, link) {
  const complete = sigs.length >= 2;
  const partyLabel = (p) => (p === "provider" ? "נותן השירות" : "המזמין");
  const rows = sigs
    .map(
      (s) =>
        `<tr><td style="padding:6px 0;color:#7a7a8c">${partyLabel(s.party)}</td><td style="padding:6px 0"><b>${esc(s.signer_name)}</b>, ${esc(
          s.signer_role || ""
        )}<br><span style="font-size:13px;color:#7a7a8c">${heDate(s.signed_at)}</span></td></tr>`
    )
    .join("");
  const status = complete
    ? `<p style="margin:0 0 12px;font-size:19px;font-weight:bold">ההסכם נחתם על ידי שני הצדדים ✓</p>
       <p style="margin:0 0 12px">מצורף העותק החתום והמלא של <b>${esc(agreement.title)}</b>. מומלץ לשמור אותו.</p>`
    : `<p style="margin:0 0 12px;font-size:19px;font-weight:bold">ההסכם נחתם על ידי ${esc(latest.signer_name)} (${partyLabel(latest.party)})</p>
       <p style="margin:0 0 12px">מצורף עותק של <b>${esc(agreement.title)}</b> עם החתימה. ההסכם ייכנס לתוקף לאחר חתימת הצד השני, ואז יישלח עותק סופי לשני הצדדים.</p>`;
  const html = shell(
    status +
      `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:15px">${rows}</table>
       <p style="margin:0 0 6px;font-size:13px;color:#7a7a8c">טביעת האצבע הדיגיטלית של המסמך (<span dir="ltr">SHA-256</span>):</p>
       <p dir="ltr" style="margin:0 0 16px;font-size:12px;font-family:monospace;word-break:break-all;color:#3b3d57">${latest.doc_hash}</p>
       <div style="text-align:center;margin:20px 0 4px"><a href="${link}" style="display:inline-block;background:#232dce;color:#fff;text-decoration:none;border-radius:999px;padding:13px 28px;font-weight:bold">לצפייה בהסכם</a></div>`
  );
  const text =
    (complete ? `ההסכם נחתם על ידי שני הצדדים.\n` : `ההסכם נחתם על ידי ${latest.signer_name} (${partyLabel(latest.party)}).\n`) +
    `${agreement.title}\n` +
    sigs.map((s) => `${partyLabel(s.party)}: ${s.signer_name}, ${heDate(s.signed_at)}`).join("\n") +
    `\nטביעת אצבע (SHA-256): ${latest.doc_hash}\n${link}`;
  const subject = complete
    ? `${agreement.title} — נחתם על ידי שני הצדדים ✓`
    : `${agreement.title} — נחתם על ידי ${latest.signer_name} (${sigs.length}/2)`;
  return { subject, html, text };
}

function recipients(agreement, sigs) {
  const set = new Set((agreement.provider_emails || []).map((e) => e.toLowerCase()));
  for (const s of sigs) {
    set.add(s.signer_email.toLowerCase());
    if (s.party === "client" && s.details) {
      if (s.details.contact_email) set.add(s.details.contact_email.toLowerCase());
      if (s.details.billing_email) set.add(s.details.billing_email.toLowerCase());
    }
  }
  return [...set].filter(isEmail);
}

/* ---------- handlers ---------- */

async function handleGet(req, res) {
  const id = String(req.query.id || "");
  const agreement = await loadAgreement(id);
  if (!agreement) return res.status(404).json({ ok: false, error: "not_found" });

  if (req.query.pdf) {
    const pdf = await renderPdf(agreement, { full: false });
    const name = `${agreement.title.replace(/[—]/g, "-")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="agreement.pdf"; filename*=UTF-8''${encodeURIComponent(name)}`);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(pdf);
  }

  const full = validRenderToken(id, req.query.rt);
  const { hash } = agreementText(agreement);
  const sigs = await loadSignatures(id);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    ok: true,
    agreement: { id: agreement.id, title: agreement.title, provider_name: agreement.provider_name, provider_reg: agreement.provider_reg, doc_hash: hash },
    signatures: sigs.map((s) => publicSignature(s, full)),
    complete: sigs.length >= 2,
    text_changed: sigs.some((s) => s.doc_hash !== hash),
  });
}

async function handleCode(req, res, b, agreement) {
  const party = b.party === "provider" ? "provider" : "client";
  const email = clean(b.email, 160).toLowerCase();
  if (!isEmail(email)) return res.status(400).json({ ok: false, errors: ["signer.email"] });

  const existing = await supabase(`eden_agreement_signatures?agreement_id=eq.${agreement.id}&party=eq.${party}&select=id`);
  if (existing.length) return res.status(409).json({ ok: false, error: "already_signed" });

  if (party === "provider" && !(agreement.provider_emails || []).map((e) => e.toLowerCase()).includes(email))
    return res.status(403).json({ ok: false, error: "provider_email" });

  const since = new Date(Date.now() - 3600e3).toISOString();
  const recent = await supabase(
    `eden_agreement_otps?agreement_id=eq.${agreement.id}&party=eq.${party}&created_at=gte.${since}&select=id`
  );
  if (recent.length >= MAX_CODES_PER_HOUR) return res.status(429).json({ ok: false, error: "too_many_codes" });

  const code = String(crypto.randomInt(0, 1e6)).padStart(6, "0");
  await supabase("eden_agreement_otps", {
    method: "POST",
    body: JSON.stringify({
      agreement_id: agreement.id, party, email,
      code_hash: sha256(`${agreement.id}:${party}:${email}:${code}`),
      expires_at: new Date(Date.now() + CODE_TTL_MIN * 60e3).toISOString(),
      ip: clientIp(req),
    }),
  });
  await sendMail({ to: email, ...codeMail(agreement, code) });
  return res.status(200).json({ ok: true, ttl_min: CODE_TTL_MIN });
}

async function handleSign(req, res, b, agreement) {
  const party = b.party === "provider" ? "provider" : "client";
  const { signer, errors } = readSigner(b);
  let details = {};
  if (party === "client") {
    const r = readClientDetails(b);
    details = r.details;
    errors.push(...r.errors);
  }
  const signature = String(b.signature || "");
  if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(signature) || signature.length < 1500 || signature.length > 400000)
    errors.push("signature");
  if (b.consent !== true) errors.push("consent");
  if (clean(b.typed_name, 80) !== signer.name) errors.push("typed_name");
  const code = digits(b.code);
  if (code.length !== 6) errors.push("code");
  if (errors.length) return res.status(400).json({ ok: false, errors: [...new Set(errors)] });

  if (party === "provider" && !(agreement.provider_emails || []).map((e) => e.toLowerCase()).includes(signer.email))
    return res.status(403).json({ ok: false, error: "provider_email" });

  // one-time code
  const [otp] = await supabase(
    `eden_agreement_otps?agreement_id=eq.${agreement.id}&party=eq.${party}&email=eq.${encodeURIComponent(signer.email)}&used_at=is.null&select=*&order=created_at.desc&limit=1`
  );
  if (!otp || new Date(otp.expires_at) < new Date()) return res.status(400).json({ ok: false, error: "code_expired" });
  if (otp.attempts >= MAX_ATTEMPTS) return res.status(429).json({ ok: false, error: "too_many_attempts" });
  const want = Buffer.from(otp.code_hash);
  const got = Buffer.from(sha256(`${agreement.id}:${party}:${signer.email}:${code}`));
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) {
    await supabase(`eden_agreement_otps?id=eq.${otp.id}`, { method: "PATCH", body: JSON.stringify({ attempts: otp.attempts + 1 }) });
    return res.status(400).json({ ok: false, error: "code_wrong", left: MAX_ATTEMPTS - otp.attempts - 1 });
  }
  const verifiedAt = new Date().toISOString();
  await supabase(`eden_agreement_otps?id=eq.${otp.id}`, { method: "PATCH", body: JSON.stringify({ used_at: verifiedAt }) });

  // document integrity: a text that changed after the first signature cannot be signed
  const { text, hash } = agreementText(agreement);
  const before = await loadSignatures(agreement.id);
  if (before.some((s) => s.party === party)) return res.status(409).json({ ok: false, error: "already_signed" });
  if (before.some((s) => s.doc_hash !== hash)) return res.status(409).json({ ok: false, error: "text_changed" });

  const record = {
    agreement_id: agreement.id,
    party,
    signer_name: signer.name,
    signer_id_number: signer.id_number,
    signer_role: signer.role,
    signer_email: signer.email,
    details,
    signature_png: signature,
    doc_hash: hash,
    doc_text: text,
    ip: clientIp(req),
    user_agent: clean(req.headers["user-agent"], 300),
    otp_verified_at: verifiedAt,
  };
  record.signature_hash = sha256(
    JSON.stringify([record.agreement_id, party, signer, details, hash, sha256(signature), verifiedAt, record.ip])
  );

  let saved;
  try {
    [saved] = await supabase("eden_agreement_signatures", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(record),
    });
  } catch (e) {
    if (e.status === 409) return res.status(409).json({ ok: false, error: "already_signed" });
    throw e;
  }

  // signed copy to every party
  const sigs = [...before, saved];
  let emailed = false;
  try {
    const link = `${baseUrl()}/${agreement.page_path.replace(/index\.html$/, "")}`;
    let attachments;
    try {
      const pdf = await renderPdf(agreement, { full: true });
      const pdfHash = sha256(pdf);
      await supabase(`eden_agreement_signatures?id=eq.${saved.id}`, { method: "PATCH", body: JSON.stringify({ pdf_hash: pdfHash }) });
      const suffix = sigs.length >= 2 ? "חתום" : `חתימה ${sigs.length} מתוך 2`;
      attachments = [{ filename: `${agreement.title.replace(/[—]/g, "-")} - ${suffix}.pdf`, content: pdf.toString("base64") }];
    } catch (e) {
      console.error("agreement pdf failed:", e);
    }
    const mail = signedMail(agreement, sigs, saved, link);
    const to = recipients(agreement, sigs);
    const results = await Promise.allSettled(
      to.map((addr) => sendMail({ to: addr, replyTo: (agreement.provider_emails || [])[0], attachments, ...mail }))
    );
    results.forEach((r) => r.status === "rejected" && console.error("agreement mail failed:", r.reason));
    emailed = results.some((r) => r.status === "fulfilled") && !!attachments;
  } catch (e) {
    console.error("agreement notify failed:", e);
  }

  return res.status(200).json({ ok: true, complete: sigs.length >= 2, emailed });
}

module.exports = async (req, res) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  try {
    if (req.method === "GET") return await handleGet(req, res);
    if (req.method !== "POST") return res.status(405).json({ ok: false });
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const agreement = await loadAgreement(String(b.id || ""));
    if (!agreement) return res.status(404).json({ ok: false, error: "not_found" });
    if (b.action === "code") return await handleCode(req, res, b, agreement);
    if (b.action === "sign") return await handleSign(req, res, b, agreement);
    return res.status(400).json({ ok: false });
  } catch (err) {
    console.error("agreement failed:", err);
    return res.status(500).json({ ok: false, error: "server" });
  }
};
