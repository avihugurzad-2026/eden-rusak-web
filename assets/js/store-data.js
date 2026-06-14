/* Eden Rusak — "החנות" catalog (digital guides & products).
   This file is the default seed. Day-to-day editing happens in admin.html
   (saved to this browser); use the admin export to publish for everyone.
   Product fields:
   id, cat, img, title, short (card), desc (product page), includes (list),
   price (number, 0 = free), oldPrice (number or null → sale badge),
   stock ("" = unlimited, number = remaining copies, 0 = sold out),
   coupon { code, off, note } (code "" = none),
   buy (payment URL; "" = WhatsApp), active (false hides from the store). */
window.EDEN_STORE_CATEGORIES = [
  { key: "guides", label: "מדריכים דיגיטליים", note: "מדריכים פרקטיים להורדה מיידית — קוראים ומיישמים." },
  { key: "courses", label: "קורסים דיגיטליים", note: "קורסים מוקלטים בקצב שלך, מכל מכשיר וללא הגבלת זמן." },
  { key: "templates", label: "תבניות וכלים", note: "כלים מוכנים לעבודה שחוסכים שעות של ניסוי וטעייה." }
];

window.EDEN_STORE_PRODUCTS = [
  {
    id: "hooks-100", cat: "guides", img: "assets/images/work/work-20.jpg",
    title: "100 הוקים מנצחים!",
    short: "100 משפטי פתיחה שעוצרים את הגלילה — מחולקים לפי מטרות.",
    desc: "המדריך שיגמור לך את התירוץ \"אין לי רעיון לפתיח\". 100 הוקים מנצחים שמותאמים בדיוק לשנה הזו, מחולקים לפי מטרות — מכירה, חשיפה, מעורבות — ומוכנים להתאמה לכל תחום ועסק.",
    includes: ["קובץ דיגיטלי להורדה מיידית", "100 הוקים מחולקים לפי מטרות", "דוגמאות יישום לכל קטגוריה", "עדכונים שוטפים ללא עלות"],
    price: 49, oldPrice: 69, stock: "",
    coupon: { code: "EDEN10", off: "10% הנחה", note: "" },
    buy: "", active: true
  },
  {
    id: "prompts-20", cat: "guides", img: "assets/images/work/work-24.jpg",
    title: "20 פרומפטים מנצחים ליצירת תוכן",
    short: "מדריך חינמי — 20 פרומפטים שיוציאו לך תוכן מעולה מה-AI.",
    desc: "מדריך חינמי לגמרי עם 20 הפרומפטים שאני משתמשת בהם ביום-יום. מתאים גם למי שלא עבדה עם AI מעולם — מעתיקים, מדביקים ומקבלים תוכן מעולה בלי להתחיל מאפס.",
    includes: ["קובץ דיגיטלי להורדה מיידית", "20 פרומפטים מוכנים להעתקה", "מתאים גם למתחילות לגמרי"],
    price: 0, oldPrice: null, stock: "",
    coupon: { code: "", off: "", note: "" },
    buy: "", active: true
  },
  {
    id: "carousel-secrets", cat: "courses", img: "assets/images/work/work-13.jpg",
    title: "סודות הקרוסלה",
    short: "צעד אחרי צעד איך לייצר קרוסלה שתכניס לך כסף.",
    desc: "מי אמר שצריך סרטון מפוצץ כדי לגדול ברשת? בקורס הזה תלמדי צעד אחרי צעד איך לייצר קרוסלה ממירה — מהרעיון, דרך העיצוב ועד הכתיבה שמוכרת. בלי רקע בעיצוב ובלי תוכנות יקרות.",
    includes: ["גישה מיידית לכל השיעורים", "צפייה מכל מכשיר וללא הגבלת זמן", "תבניות קרוסלה מוכנות לעבודה", "מתאים גם בלי רקע בעיצוב"],
    price: 197, oldPrice: null, stock: "",
    coupon: { code: "", off: "", note: "" },
    buy: "", active: true
  },
  {
    id: "editit", cat: "courses", img: "assets/images/work/work-08.jpg",
    title: "editit — תכנית הדגל",
    short: "התכנית המקיפה בישראל בעולם יצירת התוכן. מאפס למאה.",
    desc: "שנים של עבודה וניסיון בתחום שזוקקו לתכנית אחת שכוללת את כל הסודות הכי כמוסים בתחום — ויראליות, עריכה, צילום מהנייד, מיתוג אישי ו-AI. בשפה פשוטה, עם דוגמאות אמיתיות והסברים מפורטים.",
    includes: ["גישה לכל השיעורים, גם מהנייד", "5 עולמות תוכן — מויראליות ועד AI", "תבניות, צ'קליסטים ודוגמאות מוכנות", "תכנית חיה שמתעדכנת בשוטף"],
    price: 297, oldPrice: 397, stock: "",
    coupon: { code: "", off: "", note: "" },
    buy: "", active: true
  },
  /* ---- פריטי דוגמה (פליסהולדר) — לעריכה/מחיקה בפאנל הניהול ---- */
  {
    id: "reels-guide", cat: "guides", img: "assets/images/work/work-16.jpg",
    title: "מדריך הרילסים המלא",
    short: "מהרעיון ועד ההעלאה — השיטה שלי לרילס שעובד.",
    desc: "המדריך שמלווה אותך לאורך כל הדרך: רעיון, תסריט, צילום נכון מהנייד, עריכה ב-CapCut והעלאה בזמן הנכון. כל מה שצריך כדי שהרילס הבא שלך יעבוד.",
    includes: ["קובץ דיגיטלי להורדה מיידית", "צ'קליסט הפקה לכל רילס", "טבלת שעות העלאה מומלצות"],
    price: 89, oldPrice: null, stock: "",
    coupon: { code: "EDEN10", off: "10% הנחה", note: "" },
    buy: "", active: true
  },
  {
    id: "capcut-zero", cat: "courses", img: "assets/images/work/work-19.jpg",
    title: "CapCut מאפס ועד עריכה מקצועית",
    short: "קורס עריכה מהנייד — מהבסיס ועד אפקטים וכתוביות.",
    desc: "קורס מוקלט שלוקח אותך מאפס מוחלט לעריכה שנראית יקרה — חיתוכים, קצב, כתוביות מעוצבות, אפקטים וטרנדים. הכל מהנייד, בלי מחשב ובלי תוכנות בתשלום.",
    includes: ["שיעורים מוקלטים צעד-אחר-צעד", "קבצי תרגול מוכנים", "צפייה ללא הגבלת זמן"],
    price: 79, oldPrice: 99, stock: "",
    coupon: { code: "", off: "", note: "" },
    buy: "", active: true
  },
  {
    id: "story-templates", cat: "templates", img: "assets/images/work/work-06.jpg",
    title: "30 תבניות סטורי ממירות",
    short: "תבניות קנבה מוכנות — מחליפים טקסט ומעלים.",
    desc: "30 תבניות סטורי מעוצבות שבנויות למכור: סקרים, הכרזות, מבצעים ו\"מאחורי הקלעים\". פותחים בקנבה, מחליפים טקסט ותמונה — ויש לך סטורי מקצועי בדקות.",
    includes: ["קישור לתבניות בקנבה", "30 עיצובים בשפה אחידה", "מדריך התאמה למותג שלך"],
    price: 59, oldPrice: null, stock: "",
    coupon: { code: "", off: "", note: "" },
    buy: "", active: true
  },
  {
    id: "content-calendar", cat: "templates", img: "assets/images/work/work-07.jpg",
    title: "לוח תוכן שנתי למתכננות",
    short: "שנה שלמה של רעיונות תוכן — מסודרים לפי חודשים.",
    desc: "לוח תוכן שנתי עם רעיונות לכל חודש, תאריכים חמים בישראל, ימי מודעות ורגעים שיווקיים — כדי שאף פעם לא תשבי מול פיד ריק בלי כיוון.",
    includes: ["קובץ דיגיטלי להורדה מיידית", "רעיונות לכל חודש בשנה", "תאריכים חמים ומועדים ישראליים"],
    price: 39, oldPrice: null, stock: "",
    coupon: { code: "", off: "", note: "" },
    buy: "", active: true
  }
];
