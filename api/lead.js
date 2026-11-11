/* Eden Rusak — waitlist / interest lead endpoint (Vercel function).
   Stores the lead in Supabase (public.lms_leads, read in the courses admin),
   e-mails a welcome note to the lead and a notification to the owner.
   Env: LEADS_SUPABASE_URL, LEADS_SUPABASE_SERVICE_KEY (the courses project — the site's own
        SUPABASE_* vars belong to another integration), RESEND_API_KEY, MAIL_FROM,
        LEAD_NOTIFY_TO, MAIL_REPLY_TO (optional), LEADS_ADMIN_URL (optional). */

const SOURCES = {
  "ugc-course": { label: "קורס UGC דיגיטלי — רשימת השקה" },
  "newsletter": { label: "הרשמה לעדכוני מוצרים" },
  "ugc-workshop": { label: "סדנת UGC פרונטלית" },
};
const ROLES = { beginner: "מתחילה מאפס", business: "בעלת עסק / עצמאית", creator: "מנהלת סושיאל / יוצרת תוכן", other: "אחר" };

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

async function sendMail({ to, subject, html, text, replyTo, scheduledAt }) {
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
      ...(scheduledAt ? { scheduled_at: scheduledAt } : {}),
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

/* ---------- UGC workshop: a confirmation now, and (with marketing consent) two short teasers ---------- */

const WA = "https://wa.me/972552629091?text=" + encodeURIComponent("היי עדן, השארתי פרטים לסדנת ה-UGC ואשמח לשמוע עוד 💗");
const SITE = "https://edenrusak.com/ugc-workshop";

/** ISO time `days` from today at `hour`:00 Israel time (the hour is never in the past). */
function atIsrael(days, hour) {
  const now = new Date();
  const part = (d) => Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" })
    .formatToParts(d).filter((x) => x.type !== "literal").map((x) => [x.type, Number(x.value)]));
  const n = part(now);
  const offset = Date.UTC(n.year, n.month - 1, n.day, n.hour, n.minute, n.second) - Math.floor(now.getTime() / 1000) * 1000;
  const at = new Date(Date.UTC(n.year, n.month - 1, n.day + days, hour) - offset);
  return (at > now ? at : new Date(now.getTime() + 36e5)).toISOString();
}

function shell(inner, footer) {
  return `<!doctype html>
<html lang="he" dir="rtl"><body style="margin:0;background:#fdf9f8;font-family:Arial,Helvetica,sans-serif;color:#1b1d3a">
  <div style="max-width:560px;margin:0 auto;padding:28px 16px">
    <div style="text-align:center;font-size:26px;color:#232dce;margin-bottom:18px" dir="ltr">eden rusak</div>
    <div style="background:#ffffff;border-radius:24px;padding:32px 28px;text-align:right;line-height:1.75;font-size:17px;border:1px solid #ece6ea">${inner}</div>
    <p style="text-align:center;font-size:12px;color:#86868b;margin-top:18px;line-height:1.6">${footer}</p>
  </div>
</body></html>`;
}
const p = (t, extra = "") => `<p style="margin:0 0 14px;${extra}">${t}</p>`;
const button = (href, label, bg = "#232dce") =>
  `<div style="text-align:center;margin:24px 0 8px"><a href="${href}" style="display:inline-block;background:${bg};color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 30px;font-weight:bold">${label}</a></div>`;
const box = (t) => `<div style="background:#ffeef2;border-radius:16px;padding:18px 20px;margin:22px 0">${t}</div>`;
const sign = p("מחכה לראות אותך יוצרת,<br><b>עדן רוסק</b>", "margin:22px 0 0");
const unsub = "קיבלת את המייל כי השארת פרטים לסדנת ה-UGC באתר edenrusak.com.<br>לא רוצה לקבל ממני עוד מיילים? השיבי \"הסרה\" ואוריד אותך מהרשימה.";

function workshopConfirmMail(first) {
  const hi = first ? `${esc(first)}, קיבלתי! 💗` : "קיבלתי! 💗";
  const html = shell(
    p(hi, "font-size:22px;font-weight:bold") +
      p("איזה כיף שאת רוצה להיות בצד היוצר של המצלמה. הפרטים שלך אצלי, ו<b>בימים הקרובים אחזור אלייך אישית</b> עם כל מה שצריך לדעת: המועד הקרוב, המיקום, המחיר ואיך שומרים מקום.") +
      box(
        `<p style="margin:0 0 8px;font-weight:bold">מה קורה עכשיו?</p><p style="margin:0">✓ הפרטים שלך נשמרו<br>✓ אני עוברת עליהם בעצמי, לא רובוט ולא מוקד<br>✓ אחזור אלייך עם הפרטים המלאים, בטלפון או בוואטסאפ</p>`
      ) +
      p("<b>ובינתיים, משימה קטנה בשבילך:</b> תסתכלי סביבך בבית ותמצאי פינה אחת עם אור טבעי יפה. חלון, שולחן, אדן. לא משנה מה. צלמי אותה, ושמרי את התמונה.") +
      p("בסדנה נגלה למה דווקא הפינה הזו יכולה להפוך לסט צילום שמותגים משלמים עליו 😉") +
      p("הקבוצה קטנה מאוד, 4-6 משתתפות בלבד. אם את רוצה לשמוע את הפרטים כבר היום, כתבי לי:", "margin-top:20px") +
      button(WA, "לשיחה איתי בוואטסאפ", "#1faa59") +
      sign,
    "קיבלת את המייל כי השארת פרטים לסדנת ה-UGC באתר edenrusak.com."
  );
  const text = `${first ? first + ", " : ""}קיבלתי!
הפרטים שלך אצלי, ובימים הקרובים אחזור אלייך אישית עם כל מה שצריך לדעת: המועד הקרוב, המיקום, המחיר ואיך שומרים מקום.

משימה קטנה בינתיים: מצאי בבית פינה אחת עם אור טבעי יפה וצלמי אותה. בסדנה נגלה למה היא יכולה להפוך לסט צילום שמותגים משלמים עליו.

רוצה לשמוע את הפרטים כבר היום? ${WA}

עדן רוסק`;
  return { subject: `${first ? first + ", " : ""}המקום שלך בסדנה כמעט שמור 🎬`, html, text };
}

function workshopTeaserHooks(first) {
  const html = shell(
    p(`${first ? esc(first) + ", " : ""}יש לך 3 שניות.`, "font-size:22px;font-weight:bold") +
      p("זה כל הזמן שיש לסרטון כדי לעצור את האגודל. אחרי 3 שניות היא כבר בסרטון הבא, ואף אחד לא ראה את המוצר המהמם שצילמת.") +
      p("ומה שהכי מפתיע: מה שעוצר אנשים הוא כמעט אף פעם לא הצילום היפה. זה <b>המשפט הראשון</b>.") +
      box(
        `<p style="margin:0 0 8px;font-weight:bold">שלושה פתיחים שעובדים כמעט על כל מוצר:</p><p style="margin:0">1. "לא האמנתי שזה יעבוד, אבל..."<br>2. "הטעות שכולן עושות עם ___"<br>3. "אם יש לך ___, את חייבת לראות את זה"</p>`
      ) +
      p("בסדנה נכתוב יחד פתיחים כאלה למוצר אמיתי, נצלם אותם ונערוך אותם לסרטון שנכנס לתיק העבודות שלך. ביום אחד.") +
      p("עוד לא דיברנו? כתבי לי ואספר לך על המועד הקרוב:", "margin-top:20px") +
      button(WA, "אני רוצה את הפרטים", "#1faa59") +
      sign,
    unsub
  );
  const text = `${first ? first + ", " : ""}יש לך 3 שניות.
זה כל הזמן שיש לסרטון כדי לעצור את האגודל. ומה שעוצר אנשים הוא כמעט אף פעם לא הצילום היפה, זה המשפט הראשון.

שלושה פתיחים שעובדים כמעט על כל מוצר:
1. "לא האמנתי שזה יעבוד, אבל..."
2. "הטעות שכולן עושות עם ___"
3. "אם יש לך ___, את חייבת לראות את זה"

בסדנה נכתוב פתיחים כאלה למוצר אמיתי, נצלם ונערוך אותם לסרטון לתיק העבודות שלך.
לפרטים: ${WA}

עדן רוסק
להסרה מהרשימה השיבי "הסרה".`;
  return { subject: "הסוד של 3 השניות הראשונות 👀", html, text };
}

function workshopTeaserBrands(first) {
  const html = shell(
    p(`${first ? esc(first) + ", " : ""}מה מותגים באמת מחפשים?`, "font-size:22px;font-weight:bold") +
      p("לא מצלמה יקרה. לא סטודיו. ולא מיליון עוקבות.") +
      p("הם מחפשים מישהי שיודעת לגרום למוצר להרגיש <b>אמיתי</b>. כזה שמישהי בבית משתמשת בו, אוהבת אותו וממליצה עליו לחברה. זה כל הסוד של UGC, וזו בדיוק הסיבה שאפשר לעשות את זה מהבית, עם הטלפון שכבר יש לך.") +
      box(
        `<p style="margin:0 0 8px;font-weight:bold">ביום הסדנה את:</p><p style="margin:0">🎬 מצלמת מוצרים אמיתיים בסביבה ביתית<br>✍️ כותבת תסריט ופתיחים שמחזיקים צפייה<br>✂️ עורכת ב-CapCut סרטון שלם משלך<br>🎁 יוצאת עם ערכת ציוד במתנה וסרטון לתיק העבודות</p>`
      ) +
      p("ואנחנו רק 4-6 בקבוצה, אז כל אחת מקבלת ממני יחס, הכוונה ומשוב אישי לאורך כל היום.") +
      button(SITE + "#register", "לכל הפרטים על הסדנה") +
      p(`או פשוט <a href="${WA}" style="color:#232dce;font-weight:bold">כתבי לי בוואטסאפ</a> ונדבר.`, "text-align:center") +
      sign,
    unsub
  );
  const text = `${first ? first + ", " : ""}מה מותגים באמת מחפשים?
לא מצלמה יקרה, לא סטודיו ולא מיליון עוקבות. הם מחפשים מישהי שיודעת לגרום למוצר להרגיש אמיתי. וזה אפשרי מהבית, עם הטלפון שכבר יש לך.

ביום הסדנה: מצלמות מוצרים אמיתיים, כותבות תסריט ופתיחים, עורכות ב-CapCut ויוצאות עם ערכת ציוד במתנה וסרטון לתיק העבודות. רק 4-6 בקבוצה.

לפרטים: ${SITE}
וואטסאפ: ${WA}

עדן רוסק
להסרה מהרשימה השיבי "הסרה".`;
  return { subject: "מה מותגים באמת מחפשים (זה לא מה שחשבת)", html, text };
}

function ownerMail(lead, sourceLabel) {
  const rows = [
    ["שם", lead.full_name],
    ["טלפון", lead.phone],
    ["אימייל", lead.email],
    ["מקור", sourceLabel],
    ["מה מתאר אותה", lead.notes || ""],
    ["מיילים שיווקיים", lead.utm && lead.utm.marketing_consent ? "אישרה" : ""],
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
  const consent = source === "ugc-workshop" && b.consent === true;
  if (consent) utm.marketing_consent = "yes";
  const role = source === "ugc-workshop" && ROLES[b.role] ? ROLES[b.role] : null;

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
      body: JSON.stringify({ source, full_name, phone, email, utm, page, ...(role ? { notes: `מה מתאר אותה: ${role}` } : {}) }),
    });

    const firstName = full_name.split(" ")[0];
    const replyTo = process.env.MAIL_REPLY_TO;
    const welcome = source === "ugc-workshop" ? workshopConfirmMail(firstName) : welcomeMail(firstName);
    const results = await Promise.allSettled([
      source === "newsletter" ? Promise.resolve(null) : sendMail({ to: email, replyTo, ...welcome }),
      process.env.LEAD_NOTIFY_TO
        ? sendMail({ to: process.env.LEAD_NOTIFY_TO, replyTo: email, ...ownerMail(lead, SOURCES[source].label) })
        : Promise.resolve(),
    ]);
    if (consent) {
      /* teasers go out by Resend's scheduler: tomorrow 10:00 and the day after 19:00, Israel time */
      const later = await Promise.allSettled([
        sendMail({ to: email, replyTo, scheduledAt: atIsrael(1, 10), ...workshopTeaserHooks(firstName) }),
        sendMail({ to: email, replyTo, scheduledAt: atIsrael(2, 19), ...workshopTeaserBrands(firstName) }),
      ]);
      later.forEach((r) => r.status === "rejected" && console.error("workshop teaser failed:", r.reason));
    }
    results.forEach((r) => r.status === "rejected" && console.error("lead mail failed:", r.reason));
    if (source !== "newsletter" && results[0].status === "fulfilled")
      await supabase(`lms_leads?id=eq.${lead.id}`, { method: "PATCH", body: JSON.stringify({ email_sent: true }) });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("lead failed:", err);
    return res.status(500).json({ ok: false });
  }
};
