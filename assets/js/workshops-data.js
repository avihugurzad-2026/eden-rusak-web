/* Eden Rusak — workshops catalog.
   Default seed for the workshop cards on workshops.html; day-to-day editing
   happens in admin.html (saved to this browser, export to publish).
   Fields: id, tag, title, text, cap (capacity note), status (registration
   note), price (text, optional), img, imgPos (object-position, optional),
   sticker (badge on the image, optional), link (empty = no button), linkText, active. */
window.EDEN_WORKSHOPS = [
  {
    id: "ugc-workshop", tag: "מעשי", title: "סדנת UGC",
    text: "הכנסי לתחום הכי חם בשנים האחרונות בעולם השיווק!",
    cap: "", status: "", sticker: "ההרשמה נסגרה",
    price: "", img: "assets/images/work/work-23.jpg",
    link: "", linkText: "", active: true
  },
  {
    id: "content-workshop", tag: "קבוצתי", title: "סדנה ליצירת תוכן",
    text: "", cap: "עד 12 משתתפים",
    status: "", sticker: "ההרשמה נפתחת בקרוב",
    price: "", img: "assets/images/eden-portrait-2.jpg", imgPos: "center 38%",
    link: "", linkText: "", active: true
  }
];
