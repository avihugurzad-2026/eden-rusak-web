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
    id: "editit", cat: "courses", img: "assets/images/work/work-08.jpg",
    title: "editit — תכנית הדגל",
    short: "התכנית המקיפה בישראל בעולם יצירת התוכן. מאפס למאה.",
    desc: "שנים של עבודה וניסיון בתחום שזוקקו לתכנית אחת שכוללת את כל הסודות הכי כמוסים בתחום — ויראליות, עריכה, צילום מהנייד, מיתוג אישי ו-AI. בשפה פשוטה, עם דוגמאות אמיתיות והסברים מפורטים.",
    includes: ["גישה לכל השיעורים, גם מהנייד", "5 עולמות תוכן — מויראליות ועד AI", "תבניות, צ'קליסטים ודוגמאות מוכנות", "תכנית חיה שמתעדכנת בשוטף"],
    price: 99, oldPrice: 597, stock: "",
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
    id: "content-calendar", cat: "templates", img: "assets/images/work/work-07.jpg",
    title: "לוח תוכן",
    short: "לוח תוכן לתכנון העבודה והיצירה שלך.",
    desc: "לפרטים על לוח התוכן אפשר ליצור קשר עם עדן.",
    includes: [],
    price: null, oldPrice: null, stock: "",
    coupon: { code: "", off: "", note: "" },
    buy: "", active: true
  }
];
