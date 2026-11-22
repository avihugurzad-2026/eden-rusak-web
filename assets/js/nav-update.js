(function () {
  var menu = document.querySelector('.nav-academy');
  if (!menu) return;
  var toggle = document.querySelector('.nav-toggle');
  document.addEventListener('click', function (event) {
    if (!menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    link.addEventListener('click', function () {
      menu.open = false;
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
  });
  if (toggle) toggle.addEventListener('click', function () {
    if (!document.body.classList.contains('nav-open')) menu.open = false;
  });
}());
