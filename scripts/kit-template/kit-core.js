/**
 * Presentation Kit — shared pure logic.
 *
 * Dependency-free IIFE, no `import`/`export` — loadable two ways:
 *   1. As a classic inline `<script>` inside `edytor.html` (injected verbatim
 *      at the `/*__KIT_CORE__*\/` token by `scripts/build-presentation-kit.ts`),
 *      where it sets `window.KitCore` (== `globalThis.KitCore` in a browser).
 *   2. By Vitest, via `import './kit-core.js'` for its side effect, then
 *      reading `globalThis.KitCore` (see `kit-core.test.ts`).
 *
 * Implements the `KitCore` API pinned in
 * `docs/superpowers/plans/2026-07-15-presentation-kit.md` (draft schema,
 * template -> engine-slide mapping, `serializeSlidesJs`). See
 * `docs/superpowers/specs/2026-07-15-presentation-kit-design.md` §3.2, §4, §7
 * for the design rationale — in particular §4's trust boundary: every
 * player-typed string is HTML-escaped here before it reaches engine data,
 * because the cinematic-slideshow engine's `esc()` is a no-op.
 *
 * No site source is touched by this file; the engine
 * (`public/prezentacja/ug2/{engine.js,base.css,themes/cthulhu.css}`) is read
 * as-is elsewhere and never modified.
 */
(function () {
  'use strict';

  var TEMPLATES = ['tytulowy', 'przerywnik', 'obraz', 'cytat', 'final'];
  var KB_VALUES = ['in', 'out', 'left', 'right'];
  var FX_VALUES = ['flash', 'pulse'];
  var DRAFT_VERSION = 1;

  // A `custom` asset ref's `dataUrl` must be a genuine base64 image data-URL
  // — nothing else is ever legitimate here (see draft schema, spec §3.3).
  // Rejecting anything that doesn't match closes off the obvious injection
  // vector (e.g. a hostile string smuggled into a hand-edited/tampered
  // szkic.json landing in an `<img src>` unescaped downstream).
  var DATA_URL_RE = /^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+\/=\s]*$/i;

  // ── escapeHtml ────────────────────────────────────────────────
  // Order matters: '&' must be replaced first, or later replacements would
  // double-escape the entities they themselves introduce.
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── draft factory ────────────────────────────────────────────
  function newDraft(slug) {
    return {
      version: DRAFT_VERSION,
      slug: slug,
      theme: 'cthulhu',
      acts: [],
      slides: [],
      updatedAt: new Date().toISOString(),
    };
  }

  // ── validation ───────────────────────────────────────────────
  function isPlainObject(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
  }

  function isAssetRef(v) {
    if (v == null) return true; // null is a valid "no image" value
    if (!isPlainObject(v)) return false;
    if (v.kind === 'library') return typeof v.id === 'string' && v.id.length > 0;
    if (v.kind === 'custom') return typeof v.dataUrl === 'string' && DATA_URL_RE.test(v.dataUrl);
    return false;
  }

  function validateDraft(obj) {
    var errors = [];

    if (!isPlainObject(obj)) {
      return { ok: false, errors: ['draft is not an object'] };
    }

    if (obj.version !== DRAFT_VERSION) {
      errors.push('unsupported version: ' + JSON.stringify(obj.version) + ' (expected ' + DRAFT_VERSION + ')');
    }
    if (typeof obj.slug !== 'string' || obj.slug.length === 0) {
      errors.push('slug must be a non-empty string');
    }
    if (typeof obj.theme !== 'string' || obj.theme.length === 0) {
      errors.push('theme must be a non-empty string');
    }
    if (typeof obj.updatedAt !== 'string') {
      errors.push('updatedAt must be an ISO date string');
    }

    var actIds = {};
    if (!Array.isArray(obj.acts)) {
      errors.push('acts must be an array');
    } else {
      obj.acts.forEach(function (act, i) {
        if (!isPlainObject(act)) {
          errors.push('acts[' + i + '] is not an object');
          return;
        }
        if (typeof act.id !== 'string' || act.id.length === 0) {
          errors.push('acts[' + i + '].id must be a non-empty string');
        } else {
          actIds[act.id] = true;
        }
        if (typeof act.name !== 'string' || act.name.length === 0) {
          errors.push('acts[' + i + '].name must be a non-empty string');
        }
        if (act.track !== null && typeof act.track !== 'string') {
          errors.push('acts[' + i + '].track must be a string filename or null');
        }
      });
    }

    if (!Array.isArray(obj.slides)) {
      errors.push('slides must be an array');
    } else {
      obj.slides.forEach(function (slide, i) {
        if (!isPlainObject(slide)) {
          errors.push('slides[' + i + '] is not an object');
          return;
        }
        if (typeof slide.id !== 'string' || slide.id.length === 0) {
          errors.push('slides[' + i + '].id must be a non-empty string');
        }
        if (TEMPLATES.indexOf(slide.template) === -1) {
          errors.push('slides[' + i + '].template is unknown: ' + JSON.stringify(slide.template));
        }
        if (slide.actId !== null && slide.actId !== undefined) {
          if (typeof slide.actId !== 'string' || !actIds[slide.actId]) {
            errors.push('slides[' + i + '].actId "' + slide.actId + '" does not reference a known act');
          }
        }
        if (!isAssetRef(slide.image)) {
          errors.push('slides[' + i + '].image is not a valid asset reference');
        }
        if (!isAssetRef(slide.portrait)) {
          errors.push('slides[' + i + '].portrait is not a valid asset reference');
        }
        if (slide.kb !== null && slide.kb !== undefined && KB_VALUES.indexOf(slide.kb) === -1) {
          errors.push('slides[' + i + '].kb is invalid: ' + JSON.stringify(slide.kb));
        }
        if (slide.fx !== null && slide.fx !== undefined && FX_VALUES.indexOf(slide.fx) === -1) {
          errors.push('slides[' + i + '].fx is invalid: ' + JSON.stringify(slide.fx));
        }
        if (slide.dur !== undefined && typeof slide.dur !== 'number') {
          errors.push('slides[' + i + '].dur must be a number');
        }
      });
    }

    return { ok: errors.length === 0, errors: errors };
  }

  // ── template -> engine kind ──────────────────────────────────
  function kindForTemplate(template) {
    switch (template) {
      case 'tytulowy':
        return 'title';
      case 'przerywnik':
        return 'card';
      case 'obraz':
        return 'image';
      case 'cytat':
        return 'image';
      case 'final':
        return 'end';
      default:
        return 'card';
    }
  }

  function resolveOrNull(ref, resolveImage) {
    if (!ref) return null;
    return resolveImage(ref);
  }

  // ── whitelist clamps (defense-in-depth) ──────────────────────
  // validateDraft already rejects out-of-list kb/fx values, but
  // draftToEngineData must not trust that every caller validated first (e.g.
  // a future call site, or a draft mutated in-memory after validation) — so
  // clamp again here, at the point where the value is actually written into
  // engine data.
  function clampKb(v) {
    return KB_VALUES.indexOf(v) !== -1 ? v : 'in';
  }

  function clampFx(v) {
    return FX_VALUES.indexOf(v) !== -1 ? v : null;
  }

  // ── draft -> engine data ─────────────────────────────────────
  function draftToEngineData(draft, resolveImage) {
    var actsById = {};
    (draft.acts || []).forEach(function (act) {
      actsById[act.id] = act;
    });

    var tracks = {};

    var slides = (draft.slides || []).map(function (slide) {
      var kind = kindForTemplate(slide.template);
      var engineSlide = { kind: kind, dur: slide.dur || 6500 };

      var img = null;
      if (slide.template === 'tytulowy' || slide.template === 'obraz' || slide.template === 'cytat') {
        img = resolveOrNull(slide.image, resolveImage);
      }
      if (img) {
        // Defense-in-depth: legit values are base64 data-URLs (validated by
        // isAssetRef / DATA_URL_RE above) and contain no escapable
        // characters, so this is a no-op for them. It only bites a value
        // that reached here some other way (e.g. a future caller that skips
        // validateDraft), where it prevents that string from breaking out of
        // the `src="…"` attribute the engine writes it into unescaped.
        engineSlide.image = escapeHtml(img);
        engineSlide.kb = clampKb(slide.kb || 'in');
      }

      // Every template exposes the draft's `text` field (as body text, card
      // text, quote, or — for 'tytulowy' — subtitle); 'cytat' is the one
      // template that does not expose `title` (spec §3.2 table).
      if (slide.template !== 'cytat') {
        engineSlide.title = escapeHtml(slide.title);
      }
      engineSlide.text = escapeHtml(slide.text);

      if (slide.template === 'obraz' || slide.template === 'cytat') {
        var portraitImg = resolveOrNull(slide.portrait, resolveImage);
        if (portraitImg) {
          // See the `engineSlide.image` comment above — same defense-in-depth
          // reasoning applies to portrait images.
          engineSlide.portraits = [{ img: escapeHtml(portraitImg), name: escapeHtml(slide.portraitName) }];
        }
        if (slide.template === 'obraz' && slide.night) {
          engineSlide.night = true;
        }
      }

      if (
        (slide.template === 'przerywnik' || slide.template === 'obraz') &&
        slide.fx
      ) {
        var fx = clampFx(slide.fx);
        if (fx) engineSlide.fx = fx;
      }

      if (slide.actId) {
        var act = actsById[slide.actId];
        if (act) {
          engineSlide.act = escapeHtml(act.name);
          if (act.track) {
            engineSlide.track = act.track;
            tracks[act.track] = 'AUDIO';
          }
        }
      }

      return engineSlide;
    });

    return { slides: slides, tracks: tracks };
  }

  // ── engine data -> slides-data <script> body ─────────────────
  // `trackData` (optional): map of basename -> data URI (`window.__KIT_TRACKS__`
  // in the editor, or the builder's `tracks-data.js` payload). When a used
  // track's basename is present there, its TRACKS entry is inlined as a
  // literal data URI, making the exported deck fully self-contained (no
  // `assets/audio/` needed). Tracks missing from `trackData` (or when the
  // param is omitted entirely — e.g. old callers, or the editor's silent
  // preview) fall back to the original `AUDIO_BASE + file` expression, which
  // still works when the deck sits next to its kit's assets/audio/ folder.
  function serializeSlidesJs(engineData, trackData) {
    var tracks = (engineData && engineData.tracks) || {};
    var trackFiles = Object.keys(tracks);
    var data = trackData || {};
    var trackEntries = trackFiles.map(function (file) {
      if (Object.prototype.hasOwnProperty.call(data, file) && typeof data[file] === 'string') {
        return JSON.stringify(file) + ': ' + JSON.stringify(data[file]);
      }
      return JSON.stringify(file) + ': AUDIO_BASE + ' + JSON.stringify(file);
    });
    var tracksSrc = '{' + trackEntries.join(', ') + '}';
    var slidesSrc = JSON.stringify((engineData && engineData.slides) || [], null, 2);

    var src =
      'const AUDIO_BASE = "assets/audio/";\n' +
      'const TRACKS = ' + tracksSrc + ';\n' +
      'const SLIDES = ' + slidesSrc + ';\n';

    // Same reasoning as `inlineJson` in scripts/lib/package-data.ts: escape
    // every '<' so the output can never contain a closing script tag or an
    // HTML comment opener, which would break out of the enclosing script
    // element.
    return src.replace(/</g, '\\u003c');
  }

  // ── export preflight ─────────────────────────────────────────
  function assetRefKey(ref) {
    if (ref.kind === 'library') return 'library:' + ref.id;
    return 'custom:' + ref.dataUrl;
  }

  function collectImageRefs(draft) {
    var seen = {};
    var out = [];
    (draft.slides || []).forEach(function (slide) {
      [slide.image, slide.portrait].forEach(function (ref) {
        if (!ref) return;
        var key = assetRefKey(ref);
        if (seen[key]) return;
        seen[key] = true;
        out.push(ref);
      });
    });
    return out;
  }

  // ── localStorage size guard ──────────────────────────────────
  function draftByteSize(draft) {
    var json = JSON.stringify(draft);
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(json).length;
    }
    // Fallback (should not be needed in any target runtime): count UTF-8
    // bytes manually.
    var bytes = 0;
    for (var i = 0; i < json.length; i++) {
      var code = json.codePointAt(i);
      if (code > 0xffff) i++; // surrogate pair consumed two UTF-16 units
      if (code <= 0x7f) bytes += 1;
      else if (code <= 0x7ff) bytes += 2;
      else if (code <= 0xffff) bytes += 3;
      else bytes += 4;
    }
    return bytes;
  }

  globalThis.KitCore = {
    newDraft: newDraft,
    validateDraft: validateDraft,
    escapeHtml: escapeHtml,
    draftToEngineData: draftToEngineData,
    serializeSlidesJs: serializeSlidesJs,
    collectImageRefs: collectImageRefs,
    draftByteSize: draftByteSize,
  };
})();
