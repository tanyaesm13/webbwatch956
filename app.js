/* Webb Watch 956 — live story wire from WordPress + EN/ES toggle + real photos + per-article sources */
(function () {
  "use strict";

  var API_BASE = "https://public-api.wordpress.com/wp/v2/sites/webbwatch956.wordpress.com/posts";
  var API = API_BASE + "?per_page=100&_fields=id,date,slug,title,excerpt,link";
  var PHOTOS_URL = "photos.json";
  var RENDER_COUNT = 13; // hero + 12 grid cards

  var I18N = {
    en: {
      "nav-stories": "Stories", "nav-anchors": "Anchors", "nav-election": "Election 2026",
      "nav-newsletter": "Newsletter", "breaking": "LIVE DESK",
      "brand-tag": "Watching and caring for the Webb County community — Laredo and surrounding areas",
      "hero-kicker": "Top Story", "read-full": "Read the full story →",
      "anchors-title": "Meet Your Anchors",
      "anchors-sub": "The digital news anchors of the Webb Watch 956 News Desk — bringing Webb County the stories that matter, every day.",
      "walter-bio": "Co-anchor of the Webb Watch 956 News Desk. The Watchdog — keeping an eye on city hall, the county, and everybody in between.",
      "willa-bio": "Co-anchor of the Webb Watch 956 News Desk. Sharp questions, community first — covering the stories Laredo talks about.",
      "latest-title": "Latest Stories",
      "latest-sub": "Fresh from the newsroom — published on our WordPress wire and updated automatically.",
      "loading": "Loading stories…",
      "api-note": "Stories publish daily on",
      "election-title": "Election 2026",
      "election-sub": "Early voting: October 19–30. Election Day: November 3. Know your ballot before you go.",
      "nl-title": "The Webb Watch Newsletter",
      "nl-sub": "The day's top Webb County stories, in your inbox. Launching soon — leave your email and we'll let you know.",
      "nl-ph": "you@example.com", "nl-btn": "Notify me",
      "nl-note": "You're on the list — the newsletter is coming soon. Thanks for watching with us.",
      "footer-about": "Independent investigative journalism for Webb County, Texas — Laredo and surrounding areas. Bilingual, community-first, always watching.",
      "footer-follow": "Follow the Watch",
      "footer-rights": "All stories end with: Webb Watch 956.",
      "breaking-text": "Walter & Willa Webb bring you the latest from the Webb Watch 956 News Desk.",
      "load-fail": "Stories are loading from the newsroom wire — please refresh in a moment.",
      "sources": "Sources",
      "sources-full": "Sources cited in the full story →"
    },
    es: {
      "nav-stories": "Historias", "nav-anchors": "Presentadores", "nav-election": "Elecciones 2026",
      "nav-newsletter": "Boletín", "breaking": "EN VIVO",
      "brand-tag": "Vigilando y cuidando a la comunidad del Condado de Webb — Laredo y áreas cercanas",
      "hero-kicker": "Historia Principal", "read-full": "Lee la historia completa →",
      "anchors-title": "Conoce a tus Presentadores",
      "anchors-sub": "Los presentadores digitales del Noticiero de Webb Watch 956 — trayendo al Condado de Webb las historias que importan, todos los días.",
      "walter-bio": "Copresentador del Noticiero de Webb Watch 956. El Watchdog — vigilando el ayuntamiento, el condado y todos los demás.",
      "willa-bio": "Copresentadora del Noticiero de Webb Watch 956. Preguntas directas, la comunidad primero — cubriendo las historias de las que habla Laredo.",
      "latest-title": "Últimas Historias",
      "latest-sub": "Recién salidas de la redacción — publicadas en nuestro sitio de WordPress y actualizadas automáticamente.",
      "loading": "Cargando historias…",
      "api-note": "Las historias se publican a diario en",
      "election-title": "Elecciones 2026",
      "election-sub": "Votación anticipada: 19–30 de octubre. Día de las elecciones: 3 de noviembre. Conoce tu boleta antes de ir.",
      "nl-title": "El Boletín de Webb Watch",
      "nl-sub": "Las principales historias del Condado de Webb, en tu correo. Próximamente — deja tu correo y te avisaremos.",
      "nl-ph": "tu@ejemplo.com", "nl-btn": "Avísame",
      "nl-note": "Ya estás en la lista — el boletín llegará pronto. Gracias por vernos.",
      "footer-about": "Periodismo de investigación independiente para el Condado de Webb, Texas — Laredo y áreas cercanas. Bilingüe, la comunidad primero, siempre vigilando.",
      "footer-follow": "Sigue la Vigilancia",
      "footer-rights": "Todas las historias terminan con: Webb Watch 956.",
      "breaking-text": "Walter y Willa Webb te traen lo último del Noticiero de Webb Watch 956.",
      "load-fail": "Las historias se están cargando — actualiza en un momento.",
      "sources": "Fuentes",
      "sources-full": "Fuentes citadas en la historia completa →"
    }
  };

  var ES_WORDS = /\b(de|la|el|en|los|las|una|con|para|del|al|que|qué|cómo|como|está|estan|están|son|fue|han|hay|sobre|entre|hasta|desde|porque|pero|muy|sin|donde|dónde|cuando|cuándo|esta|este|estos|estas|ese|esa|sus|más|también|hoy|por|sus|nuestra|nuestro|todas|todos|ante|tras|cada|otro|otra|hacia)\b/i;
  function isSpanish(post) {
    var t = stripHtml(post.title.rendered) + " " + stripHtml(post.excerpt.rendered);
    var marks = (t.match(/[¿¡áéíóúñü]/g) || []).length;
    var words = (t.match(new RegExp(ES_WORDS.source, "gi")) || []).length;
    return marks >= 3 || words >= 3 || (marks >= 1 && words >= 2);
  }

  function stripHtml(html) {
    var d = document.createElement("div");
    d.innerHTML = html || "";
    return (d.textContent || "").replace(/\s+/g, " ").trim();
  }

  function decodeEntities(s) {
    var d = document.createElement("div");
    d.innerHTML = s || "";
    return d.textContent || "";
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "&quot;");
  }

  function fmtDate(iso, lang) {
    try {
      return new Date(iso).toLocaleDateString(lang === "es" ? "es-US" : "en-US",
        { year: "numeric", month: "long", day: "numeric" });
    } catch (e) { return iso.slice(0, 10); }
  }

  function shortUrl(url) {
    try {
      var u = new URL(url);
      var path = u.pathname === "/" ? "" : u.pathname;
      if (path.length > 42) path = path.slice(0, 42) + "…";
      return u.hostname.replace(/^www\./, "") + path;
    } catch (e) {
      return url.length > 60 ? url.slice(0, 60) + "…" : url;
    }
  }

  /* Extract the Sources/Fuentes link list from a full post body.
     Returns [{url, text}] or null when no sources section parses. */
  function parseSources(html) {
    if (!html) return null;
    var m = /<p[^>]*>\s*(Sources|Fuentes):\s*<\/p>/i.exec(html);
    if (!m) return null;
    var tail = html.slice(m.index + m[0].length);
    var end = tail.search(/<p[^>]*>\s*Webb Watch 956\s*<\/p>/i);
    if (end >= 0) tail = tail.slice(0, end);
    var ul = /<ul[^>]*>([\s\S]*?)<\/ul>/i.exec(tail);
    if (!ul) return null;
    var links = [];
    var re = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, a;
    while ((a = re.exec(ul[1]))) {
      if (/^#|javascript:/i.test(a[1])) continue;
      links.push({ url: a[1], text: stripHtml(a[2]).trim() || a[1] });
    }
    return links.length ? links : null;
  }

  var allPosts = [];
  var photoMap = {};
  var contentCache = {}; // post id -> [{url,text}] | null
  var lang = "en";

  function setLang(next) {
    lang = next;
    document.documentElement.lang = next;
    document.getElementById("lang-en").classList.toggle("active", next === "en");
    document.getElementById("lang-es").classList.toggle("active", next === "es");
    var dict = I18N[next];
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      if (dict[k]) el.textContent = dict[k];
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-ph");
      if (dict[k]) el.setAttribute("placeholder", dict[k]);
    });
    document.getElementById("breaking-text").textContent = dict["breaking-text"];
    render();
    enrichSources();
  }

  function filtered() {
    return allPosts.filter(function (p) { return isSpanish(p) === (lang === "es"); });
  }

  function renderedPosts() {
    return filtered().slice(0, RENDER_COUNT);
  }

  function creditCaption(ph) {
    var credit = escapeHtml(ph.credit || "");
    if (ph.source_url) {
      return '<a href="' + escapeAttr(ph.source_url) + '" target="_blank" rel="noopener">' + credit + "</a>";
    }
    return credit;
  }

  function photoFigure(p, cls) {
    var ph = photoMap[p.slug];
    if (!ph) return "";
    return '<figure class="' + cls + '">' +
      '<img src="' + escapeAttr(ph.src) + '" alt="' +
      escapeAttr(decodeEntities(stripHtml(p.title.rendered))) + '" loading="lazy">' +
      "<figcaption>Photo: " + creditCaption(ph) + "</figcaption></figure>";
  }

  function sourcesBlock(p) {
    var s = contentCache[p.id];
    var dict = I18N[lang];
    if (s === undefined) return ""; // content still loading; enrichSources re-renders
    if (s && s.length) {
      var items = s.map(function (l) {
        return '<li><a href="' + escapeAttr(l.url) + '" target="_blank" rel="noopener">' +
          escapeHtml(shortUrl(l.url)) + "</a></li>";
      }).join("");
      return '<details class="sources"><summary>' + escapeHtml(dict["sources"]) +
        " (" + s.length + ")</summary><ul>" + items + "</ul></details>";
    }
    return '<a class="sources-full" href="' + escapeAttr(p.link) + '" target="_blank" rel="noopener">' +
      escapeHtml(dict["sources-full"]) + "</a>";
  }

  function card(p) {
    var title = decodeEntities(stripHtml(p.title.rendered));
    var ex = decodeEntities(stripHtml(p.excerpt.rendered)).slice(0, 160);
    if (ex.length === 160) ex += "…";
    var read = I18N[lang]["read-full"];
    return '<article class="story-card">' +
      photoFigure(p, "story-photo") +
      '<p class="story-date">' + fmtDate(p.date, lang) + '</p>' +
      "<h3>" + escapeHtml(title) + "</h3>" +
      '<p class="story-excerpt">' + escapeHtml(ex) + "</p>" +
      sourcesBlock(p) +
      '<a class="card-link" href="' + escapeAttr(p.link) + '" target="_blank" rel="noopener">' + escapeHtml(read) + "</a>" +
      "</article>";
  }

  function render() {
    var posts = filtered();
    var grid = document.getElementById("story-grid");
    var dict = I18N[lang];
    if (!posts.length) {
      grid.innerHTML = '<p class="loading">' + escapeHtml(dict["load-fail"]) + "</p>";
      return;
    }
    var hero = posts[0];
    var heroTitle = decodeEntities(stripHtml(hero.title.rendered));
    document.getElementById("hero-title").textContent = heroTitle;
    document.getElementById("hero-excerpt").textContent =
      decodeEntities(stripHtml(hero.excerpt.rendered)).slice(0, 220);
    document.getElementById("hero-meta").textContent = fmtDate(hero.date, lang) + " · Webb Watch 956";
    var hl = document.getElementById("hero-link");
    hl.href = hero.link; hl.target = "_blank"; hl.rel = "noopener";
    var hfig = document.getElementById("hero-figure");
    var hph = photoMap[hero.slug];
    if (hph) {
      hfig.hidden = false;
      var hi = document.getElementById("hero-img");
      hi.src = hph.src;
      hi.alt = heroTitle;
      document.getElementById("hero-credit").innerHTML = "Photo: " + creditCaption(hph);
    } else {
      hfig.hidden = true;
    }
    document.getElementById("hero-sources").innerHTML = sourcesBlock(hero);
    grid.innerHTML = posts.slice(1, RENDER_COUNT).map(card).join("");
  }

  /* Second stage: fetch full bodies for only the posts on screen, parse
     their Sources sections, then re-render with the sources attached. */
  function enrichSources() {
    var list = renderedPosts().filter(function (p) { return !(p.id in contentCache); });
    if (!list.length) return;
    var ids = list.map(function (p) { return p.id; }).join(",");
    fetch(API_BASE + "?include=" + ids + "&_fields=id,content&per_page=100")
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (items) {
        items.forEach(function (it) {
          contentCache[it.id] = parseSources(it.content && it.content.rendered);
        });
        list.forEach(function (p) { if (!(p.id in contentCache)) contentCache[p.id] = null; });
        render();
      })
      .catch(function () {
        list.forEach(function (p) { contentCache[p.id] = null; });
        render();
      });
  }

  function load() {
    var postsP = fetch(API).then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.json();
    });
    var photosP = fetch(PHOTOS_URL).then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.json();
    }).catch(function () { return {}; });
    Promise.all([postsP, photosP]).then(function (res) {
      allPosts = res[0].slice().sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
      });
      photoMap = res[1] || {};
      render();
      enrichSources();
    }).catch(function () {
      document.getElementById("story-grid").innerHTML =
        '<p class="loading">' + escapeHtml(I18N[lang]["load-fail"]) + "</p>";
    });
  }

  document.getElementById("lang-en").addEventListener("click", function () { setLang("en"); });
  document.getElementById("lang-es").addEventListener("click", function () { setLang("es"); });

  document.getElementById("nl-form").addEventListener("submit", function (e) {
    e.preventDefault();
    document.getElementById("nl-note").hidden = false;
    document.getElementById("nl-email").value = "";
  });

  setLang("en");
  load();
})();
