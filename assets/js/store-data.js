/* Eden Rusak — "החנות" catalog (digital guides & products).
   This file is the default seed; live catalog overrides come from Supabase (eden_site_content).
   Product fields:
   id, cat, img, title, short (card), desc (product page), includes (list),
   price (number, 0 = free), oldPrice (number or null → sale badge),
   stock ("" = unlimited, number = remaining copies, 0 = sold out),
   coupon { code, off, note } (code "" = none),
   buy (payment URL; "" = WhatsApp), active (false hides from the store). */
window.EDEN_STORE_CATEGORIES = [
  { key: "guides", label: "מדריכים דיגיטליים", note: "מדריכים פרקטיים להורדה מיידית — קוראות ומיישמות." },
  { key: "courses", label: "קורסים דיגיטליים", note: "קורסים מוקלטים בקצב שלך, מכל מכשיר." },
  { key: "templates", label: "תבניות וכלים", note: "כלים מוכנים לעבודה שחוסכים שעות של ניסוי וטעייה." }
];

window.EDEN_STORE_PRODUCTS = [
  {
    id: "editit", cat: "courses", img: "/assets/images/work/work-08.jpg",
    title: "editit — תוכנית הדגל",
    short: "תוכנית מקיפה ליצירת תוכן, צעד אחרי צעד מאפס.",
    desc: "שנים של עבודה וניסיון בתחום שזוקקו לתוכנית אחת שכוללת את כל הסודות הכי כמוסים בתחום — ויראליות, עריכה, צילום מהנייד, מיתוג אישי ו-AI. בשפה פשוטה, עם דוגמאות אמיתיות והסברים מפורטים.",
    includes: ["גישה לכל השיעורים ללא הגבלת זמן, כל עוד התוכנית באוויר", "5 עולמות תוכן — מויראליות ועד AI", "תבניות, צ'קליסטים ודוגמאות מוכנות", "תוכנית חיה שמתעדכנת בשוטף"],
    price: 99, oldPrice: 597, stock: "",
    coupon: { code: "", off: "", note: "" },
    buy: "https://my.schooler.biz/s/95064/1747927021904?tid=26293&utm_source=%D7%94%D7%AA%D7%95%D7%9B%D7%A0%D7%99%D7%AA+", active: true
  },
  {
    id: "carousel-secrets", cat: "courses", img: "/assets/images/work/work-13.jpg",
    title: "סודות הקרוסלה",
    short: "צעד אחרי צעד: איך בונים קרוסלה שמובילה לפניות.",
    desc: "מי אמר שצריך סרטון מפוצץ כדי לגדול ברשת? בקורס הזה תלמדי צעד אחרי צעד איך לייצר קרוסלה ממירה — מהרעיון, דרך העיצוב ועד הכתיבה שמוכרת. בלי רקע בעיצוב ובלי תוכנות יקרות.",
    includes: ["גישה מיידית לכל השיעורים", "צפייה מכל מכשיר וללא הגבלת זמן", "תבניות קרוסלה מוכנות לעבודה", "מתאים גם בלי רקע בעיצוב"],
    price: 29, oldPrice: null, stock: "",
    coupon: { code: "", off: "", note: "" },
    buy: "https://my.schooler.biz/s/105728/1764659098064", active: true
  },
  {
    id: "content-calendar", cat: "templates", img: "/assets/images/work/work-07.jpg",
    title: "לוח תוכן",
    short: "לוח תוכן לתכנון העבודה והיצירה שלך.",
    desc: "לפרטים על לוח התוכן אפשר ליצור קשר עם עדן.",
    includes: [],
    price: null, oldPrice: null, stock: "",
    coupon: { code: "", off: "", note: "" },
    buy: "", active: true
  }
];
