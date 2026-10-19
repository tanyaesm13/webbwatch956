/* Webb Watch 956 — live story wire from WordPress + EN/ES toggle + real photos + per-article sources */
(function () {
  "use strict";

  var API_BASE = "https://public-api.wordpress.com/wp/v2/sites/webbwatch956.wordpress.com/posts";
  var API = API_BASE + "?per_page=100&_fields=id,date,slug,title,excerpt,link";
  var PHOTOS_URL = "photos.json";
  var EPISODES_URL = "episodes.json";
  var LOCAL_INDEX_URL = "stories/index.json";
  var RENDER_COUNT = 13; // hero + 12 grid cards
  var localBySlug = {}; // slug -> local story JSON (website is the publication now)

  var I18N = {
    en: {
      "nav-stories": "Stories", "nav-livedesk": "Live Desk", "nav-anchors": "Anchors", "nav-election": "Election 2026",
      "nav-newsletter": "Newsletter", "breaking": "LIVE DESK",
      "livedesk-title": "Live Desk — Daily Newscast",
      "livedesk-sub": "Walter and Willa Webb bring you the day's top Webb County stories, every evening.",
      "livedesk-archive": "Past Newscasts",
      "livedesk-youtube": "🔴 Watch our live webcast on YouTube",
      "brand-tag": "Watching and caring for the Webb County community — Laredo and surrounding areas",
      "hero-kicker": "Top Story", "read-full": "Read the full story →",
      "anchors-title": "Meet Your Anchors",
      "anchors-sub": "The digital news anchors of the Webb Watch 956 News Desk — bringing Webb County the stories that matter, every day.",
      "walter-bio": "Co-anchor of the Webb Watch 956 News Desk. The Watchdog — keeping an eye on city hall, the county, and everybody in between.",
      "willa-bio": "Co-anchor of the Webb Watch 956 News Desk. Sharp questions, community first — covering the stories Laredo talks about.",
      "latest-title": "Latest Stories",
      "latest-sub": "Fresh from the newsroom — read every story right here.",
      "loading": "Loading stories…",
      "api-note": "New stories publish daily — check back often.",
      "archive-title": "All Stories",
      "archive-sub": "Every Webb Watch 956 story, newest first. Read them all right here.",
      "filter-all": "All", "filter-en": "English", "filter-es": "Español",
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
      "nav-stories": "Historias", "nav-livedesk": "En Vivo", "nav-anchors": "Presentadores", "nav-election": "Elecciones 2026",
      "nav-newsletter": "Boletín", "breaking": "EN VIVO",
      "livedesk-title": "En Vivo — Noticiero Diario",
      "livedesk-sub": "Walter y Willa Webb te traen las principales historias del Condado de Webb, cada noche.",
      "livedesk-archive": "Noticieros Anteriores",
      "livedesk-youtube": "🔴 Mira nuestra transmisión en vivo en YouTube",
      "brand-tag": "Vigilando y cuidando a la comunidad del Condado de Webb — Laredo y áreas cercanas",
      "hero-kicker": "Historia Principal", "read-full": "Lee la historia completa →",
      "anchors-title": "Conoce a tus Presentadores",
      "anchors-sub": "Los presentadores digitales del Noticiero de Webb Watch 956 — trayendo al Condado de Webb las historias que importan, todos los días.",
      "walter-bio": "Copresentador del Noticiero de Webb Watch 956. El Watchdog — vigilando el ayuntamiento, el condado y todos los demás.",
      "willa-bio": "Copresentadora del Noticiero de Webb Watch 956. Preguntas directas, la comunidad primero — cubriendo las historias de las que habla Laredo.",
      "latest-title": "Últimas Historias",
      "latest-sub": "Recién salidas de la redacción — lee cada historia aquí mismo.",
      "loading": "Cargando historias…",
      "api-note": "Nuevas historias a diario — vuelve pronto.",
      "archive-title": "Todas las Historias",
      "archive-sub": "Todas las historias de Webb Watch 956, de la más reciente a la más antigua. Léelas aquí.",
      "filter-all": "Todas", "filter-en": "English", "filter-es": "Español",
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
  var episodes = null;
  var contentCache = {}; // post id -> [{url,text}] | null
  var lang = "en";

  /* ---- Live Desk newscast player ---- */
  function fmtEpDate(iso, lg) {
    try {
      return new Date(iso + "T12:00:00").toLocaleDateString(lg === "es" ? "es-US" : "en-US",
        { year: "numeric", month: "long", day: "numeric" });
    } catch (e) { return iso; }
  }

  function playEpisode(ep) {
    var player = document.getElementById("newscast-player");
    var src = document.getElementById("newscast-source");
    src.src = ep.file;
    player.load();
    document.getElementById("newscast-title").textContent =
      lang === "es" ? (ep.title_es || ep.title_en) : ep.title_en;
    document.getElementById("newscast-date").textContent = fmtEpDate(ep.date, lang);
    document.getElementById("newscast-desc").textContent =
      lang === "es" ? (ep.desc_es || ep.desc_en || "") : (ep.desc_en || "");
    var items = document.querySelectorAll("#newscast-archive li");
    items.forEach(function (li) {
      li.classList.toggle("active", li.getAttribute("data-file") === ep.file);
    });
  }

  function renderEpisodes() {
    if (!episodes || !episodes.episodes || !episodes.episodes.length) return;
    var list = document.getElementById("newscast-archive");
    list.innerHTML = episodes.episodes.map(function (ep) {
      var t = lang === "es" ? (ep.title_es || ep.title_en) : ep.title_en;
      return '<li data-file="' + escapeAttr(ep.file) + '"><button type="button">' +
        "<strong>" + escapeHtml(t) + "</strong>" +
        '<span class="ep-date">' + escapeHtml(fmtEpDate(ep.date, lang)) + "</span></button></li>";
    }).join("");
    list.querySelectorAll("li button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.parentElement.getAttribute("data-file");
        var ep = episodes.episodes.find(function (e) { return e.file === f; });
        if (ep) { playEpisode(ep); document.getElementById("newscast-player").play(); }
      });
    });
    var latest = episodes.episodes.find(function (e) { return e.file === episodes.latest; }) ||
      episodes.episodes[0];
    playEpisode(latest);
  }

  function loadEpisodes() {
    fetch(EPISODES_URL).then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.json();
    }).then(function (data) {
      episodes = data;
      renderEpisodes();
    }).catch(function () {
      document.getElementById("newscast-title").textContent =
        lang === "es" ? "El noticiero llegará pronto." : "The newscast is on its way.";
    });
  }

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
    renderArchive();
    renderEpisodes();
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
    return '<a class="sources-full" href="story.html?slug=' + escapeAttr(p.slug) + '">' +
      escapeHtml(dict["sources-full"]) + "</a>";
  }

  function storyUrl(p) {
    return "story.html?slug=" + encodeURIComponent(p.slug);
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
      '<a class="card-link" href="' + escapeAttr(storyUrl(p)) + '">' + escapeHtml(read) + "</a>" +
      "</article>";
  }

  /* ---- Full Stories archive ---- */
  var archiveFilter = "all";

  function renderArchive() {
    var list = document.getElementById("archive-list");
    if (!list) return;
    var dict = I18N[lang];
    var items = allPosts.filter(function (p) {
      if (archiveFilter === "all") return true;
      return isSpanish(p) === (archiveFilter === "es");
    });
    list.innerHTML = items.map(function (p) {
      var title = decodeEntities(stripHtml(p.title.rendered));
      var badge = isSpanish(p) ? "ES" : "EN";
      return '<li><span class="archive-date">' + escapeHtml(fmtDate(p.date, lang)) + "</span>" +
        '<a href="' + escapeAttr(storyUrl(p)) + '">' + escapeHtml(title) + "</a>" +
        '<span class="lang-badge">' + badge + "</span></li>";
    }).join("");
    document.querySelectorAll("#archive-filters button").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-filter") === archiveFilter);
      var k = btn.getAttribute("data-i18n");
      if (k && dict[k]) btn.textContent = dict[k];
    });
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
    hl.href = storyUrl(hero); hl.removeAttribute("target"); hl.removeAttribute("rel");
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
    // Website stories: parse sources straight from the local content.
    list.forEach(function (p) {
      if (String(p.id).indexOf("local-") === 0 && localBySlug[p.slug]) {
        contentCache[p.id] = parseSources(localBySlug[p.slug].content);
      }
    });
    var remote = list.filter(function (p) { return !(p.id in contentCache); });
    if (!remote.length) { render(); return; }
    var ids = remote.map(function (p) { return p.id; }).join(",");
    fetch(API_BASE + "?include=" + ids + "&_fields=id,content&per_page=100")
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (items) {
        items.forEach(function (it) {
          contentCache[it.id] = parseSources(it.content && it.content.rendered);
        });
        remote.forEach(function (p) { if (!(p.id in contentCache)) contentCache[p.id] = null; });
        render();
      })
      .catch(function () {
        remote.forEach(function (p) { contentCache[p.id] = null; });
        render();
      });
  }

  /* Normalize a local website story (stories/<slug>.json) into the
     WordPress-shaped object the renderers expect. Local wins on slug. */
  function normLocal(s) {
    return {
      id: "local-" + s.slug,
      date: s.date,
      slug: s.slug,
      title: { rendered: s.title },
      excerpt: { rendered: s.excerpt || "" },
      link: "story.html?slug=" + encodeURIComponent(s.slug)
    };
  }

  function loadLocal() {
    return fetch(LOCAL_INDEX_URL)
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (slugs) {
        return Promise.all((slugs || []).map(function (sg) {
          return fetch("stories/" + encodeURIComponent(sg) + ".json")
            .then(function (r) { return r.ok ? r.json() : null; })
            .catch(function () { return null; });
        }));
      })
      .then(function (arr) { return (arr || []).filter(Boolean); })
      .catch(function () { return []; });
  }

  function load() {
    var postsP = fetch(API).then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.json();
    }).catch(function () { return []; });
    var localP = loadLocal();
    var photosP = fetch(PHOTOS_URL).then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.json();
    }).catch(function () { return {}; });
    Promise.all([postsP, localP, photosP]).then(function (res) {
      var wpPosts = res[0] || [];
      var locals = res[1] || [];
      localBySlug = {};
      var localSlugs = {};
      locals.forEach(function (s) {
        localBySlug[s.slug] = s;
        localSlugs[s.slug] = true;
      });
      // Website stories override WordPress entries with the same slug.
      allPosts = wpPosts.filter(function (p) { return !localSlugs[p.slug]; })
        .concat(locals.map(normLocal))
        .sort(function (a, b) {
          return new Date(b.date) - new Date(a.date);
        });
      photoMap = res[2] || {};
      render();
      renderArchive();
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

  document.getElementById("archive-filters").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-filter]");
    if (!btn) return;
    archiveFilter = btn.getAttribute("data-filter");
    renderArchive();
  });

  var qp = new URLSearchParams(location.search);
  var ql = qp.get("lang");
  var startLang = (ql === "es" || ql === "en") ? ql : "en";

  setLang(startLang);
  load();
  loadEpisodes();
})();
