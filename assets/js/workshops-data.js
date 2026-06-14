/* Eden Rusak — workshops catalog.
   Default seed for the workshop cards on workshops.html; day-to-day editing
   happens in admin.html (saved to this browser, export to publish).
   Fields: id, tag, title, text, cap (capacity note), status (registration
   note), price (text, optional), img, link, linkText, active. */
window.EDEN_WORKSHOPS = [
  {
    id: "ugc-workshop", tag: "מעשי", title: "סדנת UGC",
    text: "הכנסי לתחום הכי חם בשנים האחרונות בעולם השיווק!",
    cap: "", status: "תאריך קרוב — 16.7.26, ההרשמה נסגרת בקרוב, נותרו מקומות אחרונים.",
    price: "", img: "assets/images/work/work-23.jpg",
    link: "landing.html?id=ugc-workshop", linkText: "לפרטים והרשמה", active: true
  },
  {
    id: "content-workshop", tag: "קבוצתי", title: "סדנה ליצירת תוכן",
    text: "", cap: "עד 12 משתתפים",
    status: "ההרשמה למועד הקרוב נסגרה, בקרוב יפתחו מועדים חדשים.",
    price: "", img: "assets/images/work/work-16.jpg",
    link: "landing.html?id=content-workshop", linkText: "לפרטים ולעדכון מועד חדש", active: true
  },
  {
    id: "team-workshop", tag: "לעסקים וחברות", title: "סדנת העשרה לצוות ולעובדים",
    text: "חוויה מגבשת ומעשירה לצוות — יוצרים יחד תוכן שמייצג את המותג, גם כשאין מחלקת שיווק.",
    cap: "", status: "", price: "", img: "assets/images/work/work-01.jpg",
    link: "landing.html?id=team-workshop", linkText: "לפרטים ולתיאום", active: true
  },
  {
    id: "private-workshop", tag: "1:1", title: "סדנה אישית",
    text: "מפגש אחד על אחד שתפור בדיוק עלייך — לפי הקצב, היעדים והאתגרים הספציפיים שלך.",
    cap: "", status: "", price: "", img: "assets/images/work/work-18.jpg",
    link: "landing.html?id=private-workshop", linkText: "לפרטים ולתיאום", active: true
  }
];
