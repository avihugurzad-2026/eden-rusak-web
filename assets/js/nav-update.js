(function () {
  var menus = Array.prototype.slice.call(document.querySelectorAll('.nav-academy'));
  if (!menus.length) return;
  var toggle = document.querySelector('.nav-toggle');
  function closeAll(except) { menus.forEach(function (m) { if (m !== except) m.open = false; }); }
  menus.forEach(function (menu) {
    menu.addEventListener('toggle', function () { if (menu.open) closeAll(menu); });
  });
  document.addEventListener('click', function (event) {
    menus.forEach(function (m) { if (!m.contains(event.target)) m.open = false; });
  });
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    menus.forEach(function (m) {
      if (m.open) { m.open = false; m.querySelector('summary').focus(); }
    });
  });
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    link.addEventListener('click', function () {
      closeAll();
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
  });
  if (toggle) toggle.addEventListener('click', function () {
    if (!document.body.classList.contains('nav-open')) closeAll();
  });
}());
