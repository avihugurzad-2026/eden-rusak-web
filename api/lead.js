/* Eden Rusak — waitlist / interest lead endpoint (Vercel function).
   Stores the lead in Supabase (public.lms_leads, read in the courses admin),
   e-mails a welcome note to the lead and a notification to the owner.
   Env: LEADS_SUPABASE_URL, LEADS_SUPABASE_SERVICE_KEY (the courses project — the site's own
        SUPABASE_* vars belong to another integration), RESEND_API_KEY, MAIL_FROM,
        LEAD_NOTIFY_TO, MAIL_REPLY_TO (optional), LEADS_ADMIN_URL (optional). */

const SOURCES = {
  "ugc-course": { label: "קורס UGC דיגיטלי — רשימת השקה" },
  "newsletter": { label: "הרשמה לעדכוני מוצרים" },
};

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

async function supabase(path, init) {
  const res = await fetch(`${process.env.LEADS_SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: process.env.LEADS_SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${process.env.LEADS_SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init && init.headers),
    },
  });
  if (!res.ok) throw new Error(`supabase ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

async function sendMail({ to, subject, html, text, replyTo }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "עדן רוסק <academy@edenrusak.com>",
      to: [to],
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`);
}

function welcomeMail(firstName) {
  const hi = firstName ? `היי ${esc(firstName)}, יפה שלי` : "היי יפה שלי";
  const html = `<!doctype html>
<html lang="he" dir="rtl"><body style="margin:0;background:#f7f4f0;font-family:Arial,Helvetica,sans-serif;color:#1d1d1f">
  <div style="max-width:560px;margin:0 auto;padding:28px 16px">
    <div style="text-align:center;font-size:26px;color:#2e3192;margin-bottom:18px" dir="ltr">eden rusak</div>
    <div style="background:#ffffff;border-radius:24px;padding:32px 28px;text-align:right;line-height:1.75;font-size:17px">
      <p style="margin:0 0 14px;font-size:21px;font-weight:bold">${hi} 💗</p>
      <p style="margin:0 0 14px">איזה כיף שאת רוצה לצמוח בעולם יצירת התוכן!</p>
      <p style="margin:0 0 14px">ממש בעוד כמה ימים התוכנית עולה לאוויר ואת תיהני ממנה <b>במחיר השקה מיוחד!</b></p>
      <div style="background:#fde8ee;border-radius:16px;padding:18px 20px;margin:22px 0">
        <p style="margin:0 0 8px;font-weight:bold">מה קורה עכשיו?</p>
        <p style="margin:0">✓ את רשומה לרשימת ההשקה של קורס ה-UGC הדיגיטלי<br>
        ✓ ביום ההשקה תקבלי ממני מייל עם קישור הרשמה ומחיר ההשקה — לפני כולן<br>
        ✓ מחיר ההשקה יהיה זמין לזמן מוגבל בלבד, אז שימי עין על תיבת המייל</p>
      </div>
      <p style="margin:0 0 14px">טיפ קטן: כדי שהמייל שלי לא ילך לאיבוד, העבירי אותו לתיבה הראשית (או סמני אותו בכוכב ⭐).</p>
      <p style="margin:0 0 22px">ובינתיים, בואי להכיר אותי מקרוב באינסטגרם — שם אני משתפת טיפים על UGC ויצירת תוכן כל יום.</p>
      <div style="text-align:center;margin-bottom:8px">
        <a href="https://www.instagram.com/eden.rusak/" style="display:inline-block;background:#2e3192;color:#ffffff;text-decoration:none;border-radius:999px;padding:13px 28px;font-weight:bold">לאינסטגרם של עדן</a>
      </div>
      <p style="margin:24px 0 0">מחכה לך בפנים,<br><b>עדן רוסק</b></p>
    </div>
    <p style="text-align:center;font-size:12px;color:#86868b;margin-top:18px;line-height:1.6">
      קיבלת את המייל כי השארת פרטים באתר edenrusak.com לקבלת עדכון על השקת קורס ה-UGC.<br>
      לא רוצה לקבל עדכונים? פשוט השיבי למייל הזה ונסיר אותך.
    </p>
  </div>
</body></html>`;
  const text = `${firstName ? `היי ${firstName}, יפה שלי` : "היי יפה שלי"}!
איזה כיף שאת רוצה לצמוח בעולם יצירת התוכן! ממש בעוד כמה ימים התוכנית עולה לאוויר ואת תיהני ממנה במחיר השקה מיוחד!

ביום ההשקה תקבלי ממני מייל עם קישור הרשמה ומחיר ההשקה — לפני כולן.

מחכה לך בפנים,
עדן רוסק
https://www.instagram.com/eden.rusak/`;
  return { subject: `${firstName ? firstName + ", " : ""}את ברשימת ההשקה של קורס ה-UGC 💗`, html, text };
}

function ownerMail(lead, sourceLabel) {
  const rows = [
    ["שם", lead.full_name],
    ["טלפון", lead.phone],
    ["אימייל", lead.email],
    ["מקור", sourceLabel],
    ["עמוד", lead.page || ""],
    ["UTM", Object.entries(lead.utm || {}).map(([k, v]) => `${k}=${v}`).join(", ")],
  ];
  const admin = process.env.LEADS_ADMIN_URL || "https://academy.edenrusak.com/admin/leads";
  const html = `<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6">
    <p style="font-size:18px;font-weight:bold">מתעניינת חדשה ב${esc(sourceLabel)} 🎉</p>
    <table cellpadding="6" style="border-collapse:collapse">${rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td style="color:#86868b">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`)
      .join("")}</table>
    <p><a href="https://wa.me/${esc(lead.phone.replace(/\D/g, "").replace(/^0/, "972"))}">לשליחת וואטסאפ</a> · <a href="${esc(admin)}">לכל המתעניינות במערכת</a></p>
  </div>`;
  return {
    subject: `מתעניינת חדשה: ${lead.full_name} — ${sourceLabel}`,
    html,
    text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
  };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false });
  }
  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  // honeypot: bots fill every field
  if (b.website) return res.status(200).json({ ok: true });

  const source = SOURCES[b.source] ? b.source : "ugc-course";
  const full_name = clean(b.name, 120);
  const phone = clean(b.phone, 20).replace(/[^\d+\- ]/g, "");
  const email = clean(b.email, 160).toLowerCase();
  const errors = [];
  if (full_name.length < 2) errors.push("name");
  if (phone.replace(/\D/g, "").length < 9) errors.push("phone");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push("email");
  if (source === "newsletter" && b.consent !== true) errors.push("consent");
  if (errors.length) return res.status(400).json({ ok: false, errors });

  const utm = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"])
    if (b.utm && b.utm[k]) utm[k] = clean(b.utm[k], 200);
  const page = clean(b.page, 300);
  if (source === "newsletter") utm.newsletter_consent = "yes";

  try {
    // same e-mail on the same list in the last day → don't store or mail twice
    const since = new Date(Date.now() - 864e5).toISOString();
    const dup = await supabase(
      `lms_leads?select=id&source=eq.${encodeURIComponent(source)}&email=eq.${encodeURIComponent(email)}&created_at=gte.${since}&limit=1`,
      { method: "GET" }
    );
    if (dup && dup.length) return res.status(200).json({ ok: true, duplicate: true });

    const [lead] = await supabase("lms_leads", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ source, full_name, phone, email, utm, page }),
    });

    const firstName = full_name.split(" ")[0];
    const results = await Promise.allSettled([
      source === "newsletter" ? Promise.resolve(null) : sendMail({ to: email, replyTo: process.env.MAIL_REPLY_TO, ...welcomeMail(firstName) }),
      process.env.LEAD_NOTIFY_TO
        ? sendMail({ to: process.env.LEAD_NOTIFY_TO, replyTo: email, ...ownerMail(lead, SOURCES[source].label) })
        : Promise.resolve(),
    ]);
    results.forEach((r) => r.status === "rejected" && console.error("lead mail failed:", r.reason));
    if (source !== "newsletter" && results[0].status === "fulfilled")
      await supabase(`lms_leads?id=eq.${lead.id}`, { method: "PATCH", body: JSON.stringify({ email_sent: true }) });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("lead failed:", err);
    return res.status(500).json({ ok: false });
  }
};
