/* Webb Watch 956 — full article page. Reads ?slug=, renders the whole story on webbwatch956.com */
(function () {
  "use strict";

  var API_BASE = "https://public-api.wordpress.com/wp/v2/sites/webbwatch956.wordpress.com/posts";
  var PHOTOS_URL = "photos.json";

  var STR = {
    en: {
      "kicker": "Webb Watch 956",
      "nav-livedesk": "Live Desk", "nav-stories": "Stories", "nav-anchors": "Anchors",
      "nav-election": "Election 2026", "nav-newsletter": "Newsletter",
      "breaking": "LIVE DESK",
      "breaking-text": "Walter & Willa Webb bring you the latest from the Webb Watch 956 News Desk.",
      "brand-tag": "Watching and caring for the Webb County community — Laredo and surrounding areas",
      "loading": "Loading the story…",
      "notfound": "We couldn't find that story. Head back to the full archive.",
      "sources": "Sources",
      "back": "← Back to all stories",
      "newer": "← Newer",
      "older": "Older →",
      "other": "Leer en español",
      "footer-about": "Independent investigative journalism for Webb County, Texas — Laredo and surrounding areas. Bilingual, community-first, always watching.",
      "footer-follow": "Follow the Watch",
      "footer-rights": "All stories end with: Webb Watch 956."
    },
    es: {
      "kicker": "Webb Watch 956",
      "nav-livedesk": "En Vivo", "nav-stories": "Historias", "nav-anchors": "Presentadores",
      "nav-election": "Elecciones 2026", "nav-newsletter": "Boletín",
      "breaking": "EN VIVO",
      "breaking-text": "Walter y Willa Webb te traen lo último del Noticiero de Webb Watch 956.",
      "brand-tag": "Vigilando y cuidando a la comunidad del Condado de Webb — Laredo y áreas cercanas",
      "loading": "Cargando la historia…",
      "notfound": "No pudimos encontrar esa historia. Vuelve al archivo completo.",
      "sources": "Fuentes",
      "back": "← Volver a todas las historias",
      "newer": "← Más reciente",
      "older": "Anterior →",
      "other": "Read in English",
      "footer-about": "Periodismo de investigación independiente para el Condado de Webb, Texas — Laredo y áreas cercanas. Bilingüe, la comunidad primero, siempre vigilando.",
      "footer-follow": "Sigue la Vigilancia",
      "footer-rights": "Todas las historias terminan con: Webb Watch 956."
    }
  };

  var ES_WORDS = /\b(de|la|el|en|los|las|una|con|para|del|al|que|qué|cómo|como|está|estan|están|son|fue|han|hay|sobre|entre|hasta|desde|porque|pero|muy|sin|donde|dónde|cuando|cuándo|esta|este|estos|estas|ese|esa|sus|más|también|hoy|por|sus|nuestra|nuestro|todas|todos|ante|tras|cada|otro|otra|hacia)\b/i;
  function isSpanish(post) {
    var t = stripHtml(post.title.rendered) + " " +
      stripHtml((post.excerpt && post.excerpt.rendered) || "");
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
  function fmtDate(iso, lg) {
    try {
      return new Date(iso).toLocaleDateString(lg === "es" ? "es-US" : "en-US",
        { year: "numeric", month: "long", day: "numeric" });
    } catch (e) { return iso.slice(0, 10); }
  }

  /* Extract the Sources/Fuentes link list from a full post body. */
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

  /* Clean the article body: rewrite internal WordPress story links to local
     story pages, drop any other wordpress.com link (keep its text), strip
     WP block comments. */
  function cleanBody(html) {
    var out = html || "";
    out = out.replace(/<!--[\s\S]*?-->/g, "");
    out = out.replace(/https?:\/\/webbwatch956\.wordpress\.com(?:\/\d{4}\/\d{2}\/\d{2})?\/([a-z0-9\-]+)\/?/gi,
      function (m, s) { return "story.html?slug=" + s; });
    out = out.replace(/<a\s+[^>]*href="([^"]*wordpress\.com[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
      function (m, u, t) { return t; });
    out = out.replace(/webbwatch956\.wordpress\.com/gi, "webbwatch956.com");
    return out;
  }

  function splitArticle(html) {
    var m = /<p[^>]*>\s*(Sources|Fuentes):\s*<\/p>/i.exec(html);
    if (!m) return { body: html, sources: parseSources(html) };
    return { body: html.slice(0, m.index), sources: parseSources(html) };
  }

  var slug = new URLSearchParams(location.search).get("slug");
  var lang = "en";
  var currentPost = null;

  function applyLang() {
    var dict = STR[lang];
    document.documentElement.lang = lang;
    document.getElementById("lang-en").classList.toggle("active", lang === "en");
    document.getElementById("lang-es").classList.toggle("active", lang === "es");
    document.querySelectorAll("[data-s]").forEach(function (el) {
      var k = el.getAttribute("data-s");
      if (dict[k]) el.textContent = dict[k];
    });
    document.getElementById("breaking-text").textContent = dict["breaking-text"];
    document.getElementById("art-sources-title").textContent = dict["sources"];
    var other = document.getElementById("art-other-lang");
    other.textContent = dict["other"];
    if (currentPost) {
      document.getElementById("art-meta").textContent =
        fmtDate(currentPost.date, lang) + " · Webb Watch 956";
    }
  }

  function creditCaption(ph) {
    var credit = escapeHtml(ph.credit || "");
    if (ph.source_url) {
      return '<a href="' + escapeAttr(ph.source_url) + '" target="_blank" rel="noopener">' + credit + "</a>";
    }
    return credit;
  }

  function render(p, photoMap) {
    currentPost = p;
    var title = decodeEntities(stripHtml(p.title.rendered));
    document.title = title + " — Webb Watch 956";
    document.getElementById("art-title").textContent = title;
    document.getElementById("art-meta").textContent =
      fmtDate(p.date, lang) + " · Webb Watch 956";

    var ph = photoMap[p.slug];
    var fig = document.getElementById("art-figure");
    if (ph) {
      fig.hidden = false;
      var img = document.getElementById("art-img");
      img.src = ph.src;
      img.alt = title;
      document.getElementById("art-credit").innerHTML = "Photo: " + creditCaption(ph);
    } else {
      fig.hidden = true;
    }

    var parts = splitArticle(cleanBody(p.content.rendered));
    document.getElementById("art-body").innerHTML = parts.body;

    var s = parts.sources;
    var sSec = document.getElementById("art-sources");
    if (s && s.length) {
      sSec.hidden = false;
      document.getElementById("art-sources-list").innerHTML = s.map(function (l) {
        var label = l.text && l.text !== l.url ? escapeHtml(l.text) + "<br>" : "";
        return '<li><a href="' + escapeAttr(l.url) + '" target="_blank" rel="noopener">' +
          label + '<span class="src-url">' + escapeHtml(l.url) + "</span></a></li>";
      }).join("");
    } else {
      sSec.hidden = true;
    }
    applyLang();
  }

  function loadNeighbors(p) {
    fetch(API_BASE + "?per_page=100&_fields=id,date,slug,title")
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (posts) {
        var sameLang = posts.filter(function (x) { return isSpanish(x) === (lang === "es"); })
          .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
        var i = sameLang.findIndex(function (x) { return x.slug === p.slug; });
        if (i < 0) return;
        var nav = document.getElementById("art-nav");
        var newer = sameLang[i - 1], older = sameLang[i + 1];
        var dict = STR[lang];
        var prev = document.getElementById("art-prev");
        var next = document.getElementById("art-next");
        if (newer) {
          prev.href = "story.html?slug=" + encodeURIComponent(newer.slug);
          prev.innerHTML = "<span>" + escapeHtml(dict["newer"]) + "</span><strong>" +
            escapeHtml(decodeEntities(stripHtml(newer.title.rendered))) + "</strong>";
        } else { prev.style.visibility = "hidden"; }
        if (older) {
          next.href = "story.html?slug=" + encodeURIComponent(older.slug);
          next.innerHTML = "<span>" + escapeHtml(dict["older"]) + "</span><strong>" +
            escapeHtml(decodeEntities(stripHtml(older.title.rendered))) + "</strong>";
        } else { next.style.visibility = "hidden"; }
        nav.hidden = false;
      })
      .catch(function () { /* neighbors optional */ });
  }

  function switchLang(target) {
    if (target === lang) return;
    // Try to find the translated counterpart: nearest-dated post in the
    // target language, within 36 hours. Otherwise fall back to the homepage.
    fetch(API_BASE + "?per_page=100&_fields=id,date,slug,title")
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (posts) {
        var cur = posts.find(function (x) { return x.slug === slug; });
        var best = null, bestDiff = Infinity;
        posts.forEach(function (x) {
          if (x.slug === slug) return;
          if (isSpanish(x) !== (target === "es")) return;
          var d = Math.abs(new Date(x.date) - new Date(cur ? cur.date : 0));
          if (d < bestDiff) { bestDiff = d; best = x; }
        });
        if (best && bestDiff < 36 * 3600 * 1000) {
          location.href = "story.html?slug=" + encodeURIComponent(best.slug);
        } else {
          location.href = "index.html?lang=" + target;
        }
      })
      .catch(function () {
        location.href = "index.html?lang=" + target;
      });
  }

  function showNotFound() {
    document.getElementById("art-title").textContent = STR[lang]["notfound"];
    document.getElementById("art-body").innerHTML =
      '<p><a class="btn-gold" href="index.html#stories">' + escapeHtml(STR[lang]["back"]) + "</a></p>";
    applyLang();
  }

  function load() {
    if (!slug) { showNotFound(); return; }
    // Website stories first (stories/<slug>.json); WordPress as fallback.
    var localP = fetch("stories/" + encodeURIComponent(slug) + ".json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
    var photosP = fetch(PHOTOS_URL).then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.json();
    }).catch(function () { return {}; });
    Promise.all([localP, photosP]).then(function (res) {
      if (res[0]) {
        var s = res[0];
        var p = {
          id: "local-" + s.slug,
          date: s.date,
          slug: s.slug,
          title: { rendered: s.title },
          excerpt: { rendered: s.excerpt || "" },
          content: { rendered: s.content }
        };
        lang = isSpanish(p) ? "es" : "en";
        render(p, res[1] || {});
        loadNeighbors(p);
        return;
      }
      var postP = fetch(API_BASE + "?slug=" + encodeURIComponent(slug) + "&_fields=id,date,slug,title,content")
        .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); });
      Promise.all([postP, photosP]).then(function (res2) {
        if (!res2[0].length) { showNotFound(); return; }
        var p2 = res2[0][0];
        lang = isSpanish(p2) ? "es" : "en";
        render(p2, res2[1] || {});
        loadNeighbors(p2);
      }).catch(function () { showNotFound(); });
    }).catch(function () { showNotFound(); });
  }

  document.getElementById("lang-en").addEventListener("click", function () { switchLang("en"); });
  document.getElementById("lang-es").addEventListener("click", function () { switchLang("es"); });
  document.getElementById("art-other-lang").addEventListener("click", function (e) {
    e.preventDefault();
    switchLang(lang === "en" ? "es" : "en");
  });

  applyLang();
  load();
})();
