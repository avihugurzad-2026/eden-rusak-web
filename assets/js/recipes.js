(function () {
  'use strict';
  var recipes = Array.isArray(window.EDEN_RECIPES) ? window.EDEN_RECIPES : [];
  var list = document.getElementById('recipesList'), cards = document.getElementById('recipeCards'), detail = document.getElementById('recipeDetail');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (x) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]; }); }
  function safe(s) { try { var u = new URL(s, location.href); return ['https:', 'http:'].indexOf(u.protocol) >= 0 ? u.href : ''; } catch (_) { return ''; } }
  function video(url) {
    var u = safe(url), m;
    if (!u) return '';
    if (/\.mp4(?:[?#]|$)/i.test(u)) return '<video controls playsinline preload="metadata" src="'+esc(u)+'"></video>';
    try { var v=new URL(u), h=v.hostname.replace(/^www\./,'');
      if ((h === 'instagram.com') && (m=v.pathname.match(/^\/(?:p|reel)\/([\w-]+)/))) return '<iframe title="סרטון המתכון באינסטגרם" src="https://www.instagram.com/p/'+esc(m[1])+'/embed/" loading="lazy" allowfullscreen></iframe>';
      if ((h === 'tiktok.com' || h.endsWith('.tiktok.com')) && (m=v.pathname.match(/\/video\/(\d+)/))) return '<iframe title="סרטון המתכון בטיקטוק" src="https://www.tiktok.com/embed/v2/'+m[1]+'" loading="lazy" allow="fullscreen" allowfullscreen></iframe>';
      if ((h === 'youtube.com' || h === 'youtu.be') && (m=(h==='youtu.be'?v.pathname.slice(1):v.searchParams.get('v') || v.pathname.split('/').pop()).match(/^[\w-]{11}$/))) return '<iframe title="סרטון המתכון ביוטיוב" src="https://www.youtube-nocookie.com/embed/'+m[0]+'" loading="lazy" allowfullscreen></iframe>';
    } catch (_) {} return '';
  }
  function show() {
    var id = new URLSearchParams(location.search).get('id'), item = recipes.find(function (x) { return x.id === id; });
    list.hidden = !!item; detail.hidden = !item;
    if (!item) { cards.innerHTML = recipes.length ? recipes.map(function(r) { return '<a class="recipe-card" href="recipes.html?id='+encodeURIComponent(r.id)+'">'+(safe(r.image)?'<img loading="lazy" src="'+esc(safe(r.image))+'" alt="">':'')+'<div><span class="tag">'+esc(r.category || 'מתכון')+'</span><h3>'+esc(r.title)+'</h3><p>'+esc(r.description || '')+'</p><span>למתכון המלא ←</span></div></a>'; }).join('') : '<div class="recipe-empty"><h3>המתכונים בדרך לכאן</h3><p>בקרוב אשתף כאן את המתכונים והסרטונים שלי.</p></div>'; return; }
    document.title = item.title + ' | ספר המתכונים של עדן';
    var facts = [[item.prepMinutes,'זמן הכנה'],[item.cookMinutes,'זמן בישול'],[item.servings,'מנות']].filter(function(x){return x[0]!=null && x[0]!=='';}).map(function(x){return '<div><b>'+esc(x[1])+'</b><span>'+esc(x[0])+(x[1]==='מנות'?'':' דקות')+'</span></div>';}).join('');
    var ingredients=(item.ingredients||[]).map(function(x){return '<li>'+esc(x)+'</li>';}).join(''), steps=(item.steps||[]).map(function(x){return '<li>'+esc(x)+'</li>';}).join(''), v=video(item.videoUrl), link=safe(item.videoUrl);
    detail.innerHTML = '<a href="recipes.html" class="recipe-back">← לכל המתכונים</a><div class="recipe-detail-grid"><div><span class="tag">'+esc(item.category||'מתכון')+'</span><h1 class="h2">'+esc(item.title)+'</h1><p class="lead">'+esc(item.description||'')+'</p><div class="recipe-facts">'+facts+'</div><h2 class="h3">רכיבים</h2><ul class="recipe-ingredients">'+ingredients+'</ul><h2 class="h3">אופן ההכנה</h2><ol class="recipe-steps">'+steps+'</ol>'+(item.tip?'<h2 class="h3">טיפ של עדן</h2><p>'+esc(item.tip)+'</p>':'')+'</div><div class="recipe-media">'+v+(link?'<a class="btn btn-outline" href="'+esc(link)+'" target="_blank" rel="noopener">לצפייה בסרטון המקורי</a>':'')+'</div></div>';
  }
  show();
})();
