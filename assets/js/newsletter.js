(function () {
  var form = document.getElementById('newsletterForm');
  if (!form) return;
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    var button = form.querySelector('button[type="submit"]');
    var status = document.getElementById('newsletterStatus');
    button.disabled = true;
    status.textContent = 'שולחת את הפרטים...';
    try {
      var response = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: 'newsletter', name: form.elements.name.value, phone: form.elements.phone.value, email: form.elements.email.value, consent: form.elements.consent.checked, page: location.pathname }) });
      if (!response.ok) throw new Error('request failed');
      status.textContent = 'תודה! הצטרפת לרשימת העדכונים.';
      form.reset();
    } catch (_) { status.textContent = 'לא הצלחנו לשמור את ההרשמה. נסי שוב מאוחר יותר.'; }
    button.disabled = false;
  });
})();
