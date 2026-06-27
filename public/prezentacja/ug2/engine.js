/* Urodzaj Grozy — presentation engine. Depends on TRACKS + SLIDES (slides.js). */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const show = $('#show');
  const layers = [$('#L0'), $('#L1')];
  const fill = $('#fill'), segs = $('#segs'), acttag = $('#acttag'), counter = $('#counter');
  const VOL = 0.7, XFADE = 1600;

  let idx = 0, active = 0, playing = false, started = false;
  let elapsed = 0, last = 0, raf = 0, muted = false;
  let curTrack = null;
  const audios = {};
  let curSfx = null;

  // ── build helpers ───────────────────────────────────────────
  function esc(s){return (s||'')}
  function reveals(slide, extra){
    let d = 0.12, out = '';
    if (slide.act) out += `<div class="act reveal" style="animation-delay:${d}s">${slide.act}</div>`, d+=.12;
    if (slide.title) out += `<h2 class="title ${slide.kind==='title'||slide.kind==='end'?'huge':''} reveal" style="animation-delay:${d}s">${slide.title}</h2>`, d+=.14;
    out += `<div class="gold-rule reveal" style="animation-delay:${d}s"></div>`; d+=.1;
    if (slide.text) out += `<p class="text reveal" style="animation-delay:${d}s">${slide.text}</p>`;
    return out + (extra||'');
  }
  function fxHtml(slide){ return slide.fx ? `<div class="fx ${slide.fx}"></div>` : ''; }

  function portraitList(slide){
    if (slide.portraits && slide.portraits.length) return slide.portraits;
    if (slide.portrait) return [{img:slide.portrait, name:slide.portraitName}];
    return null;
  }
  function cap(p){ return p.name ? `<figcaption>${p.name}</figcaption>` : ''; }
  function face(p){ return p.q ? `<div class="qmark">?</div>` : `<img src="${p.img}" alt="">`; }
  function portraitHtml(slide){
    const list = portraitList(slide);
    if (!list) return '';
    if (list.length === 1) {
      const p = list[0];
      return `<figure class="portrait-inset reveal" style="animation-delay:.34s">`+
        `${face(p)}${cap(p)}</figure>`;
    }
    const items = list.map((p,i)=>
      `<figure class="pf reveal" style="animation-delay:${(0.3+i*0.1).toFixed(2)}s">`+
      `${face(p)}${cap(p)}</figure>`).join('');
    return `<div class="pcluster">${items}</div>`;
  }
  function buildHTML(slide){
    const dur = slide.dur || 6500;
    if (slide.kind === 'cast') {
      const cards = slide.cast.map((c,i)=>
        `<div class="cast-card reveal" style="animation-delay:${(0.35+i*0.22).toFixed(2)}s">`+
        `<img src="${c.img}" alt=""><div class="cn">${c.name}</div><div class="cp">${c.player}</div></div>`
      ).join('');
      return `<div class="card-bg"></div><div class="cast-wrap">`+
        `<div class="act reveal" style="animation-delay:.1s">${slide.act||''}</div>`+
        `<h2 class="title reveal" style="animation-delay:.24s">${slide.title||''}</h2>`+
        `<div class="cast-row">${cards}</div></div>`;
    }
    // background: full-bleed location image, or a textured card panel
    let bg;
    if (slide.image) {
      bg = `<div class="bg kb-${slide.kb||'in'} ${slide.night?'night':''}" `+
           `style="background-image:url('${slide.image}');animation-duration:${dur}ms"></div>`+
           `<div class="veil"></div>`;
    } else {
      bg = `<div class="card-bg"></div>`;
    }
    // centered text only for text-led cards/title/end without a portrait
    const centered = !portraitList(slide) && slide.kind !== 'image';
    return bg + fxHtml(slide) + portraitHtml(slide) +
      `<div class="content ${centered?'center':''}">${reveals(slide)}</div>`;
  }

  // ── render ──────────────────────────────────────────────────
  function render(i){
    idx = (i + SLIDES.length) % SLIDES.length;
    const slide = SLIDES[idx];
    const target = active ^ 1;
    layers[target].innerHTML = buildHTML(slide);
    layers[active].classList.remove('active');
    layers[target].classList.add('active');
    active = target;
    acttag.textContent = slide.act || '';
    counter.textContent = `${idx+1} / ${SLIDES.length}`;
    [...segs.children].forEach((s,j)=>{ s.className = 'seg'+(j<idx?' done':j===idx?' cur':''); });
    elapsed = 0; fill.style.width = '0%';
    setTrack(slide.track);
    playSfx(slide);
  }

  // ── timeline ────────────────────────────────────────────────
  function tick(t){
    if (!playing) return;
    if (!last) last = t;
    elapsed += t - last; last = t;
    const dur = SLIDES[idx].dur || 6500;
    fill.style.width = Math.min(1, elapsed/dur)*100 + '%';
    if (elapsed >= dur){
      if (idx < SLIDES.length-1) { render(idx+1); }
      else { pause(); return; }
    }
    raf = requestAnimationFrame(tick);
  }
  function play(){ if(playing) return; playing=true; show.classList.remove('paused');
    last=0; raf=requestAnimationFrame(tick); resumeAudio();
    if(curSfx && started){ const p=curSfx.play(); if(p&&p.catch)p.catch(()=>{}); } setPP('⏸'); }
  function pause(){ playing=false; show.classList.add('paused'); cancelAnimationFrame(raf);
    pauseAudio(); if(curSfx) curSfx.pause(); setPP('▶'); }
  function toggle(){ playing?pause():play(); }
  function setPP(g){ const b=$('#playpause'); if(b) b.textContent=g; }

  function go(d){ render(idx+d); if(playing){ last=0; } }

  // ── audio ───────────────────────────────────────────────────
  function ramp(a, to, ms){
    if (a._ri) clearInterval(a._ri);
    const from = a.volume, steps = Math.max(1, Math.round(ms/40)); let s=0;
    a._ri = setInterval(()=>{ s++; a.volume = Math.max(0,Math.min(1, from+(to-from)*s/steps));
      if (s>=steps){ clearInterval(a._ri); a._ri=0; if(to===0) a.pause(); } }, 40);
  }
  function setTrack(name){
    if (!name || name===curTrack) return;
    const prev = curTrack && audios[curTrack];
    curTrack = name;
    const a = audios[name];
    if (prev && prev!==a) ramp(prev, 0, XFADE);
    if (a){ a.currentTime = 0; a.volume = 0; const p=a.play(); if(p&&p.catch)p.catch(()=>{});
      ramp(a, muted?0:VOL, XFADE); }
  }
  function pauseAudio(){ const a=audios[curTrack]; if(a) a.pause(); }
  function resumeAudio(){ const a=audios[curTrack]; if(a && started){ const p=a.play(); if(p&&p.catch)p.catch(()=>{});} }
  function toggleMute(){ muted=!muted; const a=audios[curTrack]; if(a) ramp(a, muted?0:VOL, 300);
    if(curSfx) curSfx.volume = muted?0:VOL;
    const b=$('#mute'); if(b) b.textContent = muted?'🔇':'♪'; }
  // one-shot sound effect layered over the music on slide enter
  function playSfx(slide){
    if (curSfx){ curSfx.pause(); curSfx=null; }
    if (!slide.sfx || !started) return;
    try { const s=new Audio(slide.sfx); s.volume=muted?0:VOL;
      const p=s.play(); if(p&&p.catch)p.catch(()=>{}); curSfx=s; } catch(e){}
  }

  // ── start ───────────────────────────────────────────────────
  function start(){
    if (started) return; started=true;
    $('#start').classList.add('hidden');
    // Start WITHOUT autoplay: show slide 1 with motion + music, but don't
    // auto-advance until the user presses play (space / ▶). Animations run
    // (no .paused), the auto-advance timer simply isn't armed.
    render(0); playing=false; setPP('▶');
  }

  // ── idle / fullscreen ───────────────────────────────────────
  let idleT;
  function wake(){ show.classList.remove('idle'); clearTimeout(idleT);
    idleT = setTimeout(()=>show.classList.add('idle'), 2800); }
  function fullscreen(){ const el=document.documentElement;
    if (!document.fullscreenElement) (el.requestFullscreen||el.webkitRequestFullscreen||(()=>{})).call(el);
    else document.exitFullscreen && document.exitFullscreen(); }

  // ── init ────────────────────────────────────────────────────
  function init(){
    // segments
    segs.innerHTML = SLIDES.map(()=>'<div class="seg"></div>').join('');
    // preload images
    SLIDES.forEach(s=>{ if(s.image){ const im=new Image(); im.src=s.image; }
      if(s.cast) s.cast.forEach(c=>{ const im=new Image(); im.src=c.img; }); });
    // audio objects
    Object.keys(TRACKS).forEach(k=>{ const a=new Audio(TRACKS[k]); a.loop=true; a.preload='auto'; a.volume=0; audios[k]=a; });
    // controls
    $('#btn-start').addEventListener('click', start);
    $('#prev').addEventListener('click', ()=>go(-1));
    $('#next').addEventListener('click', ()=>go(1));
    $('#playpause').addEventListener('click', toggle);
    $('#mute').addEventListener('click', toggleMute);
    $('#full').addEventListener('click', fullscreen);
    $('#zL').addEventListener('click', ()=>go(-1));
    $('#zC').addEventListener('click', toggle);
    $('#zR').addEventListener('click', ()=>go(1));
    document.addEventListener('keydown', (e)=>{
      if (!started){ if(e.code==='Space'||e.code==='Enter'){ e.preventDefault(); start(); } return; }
      if (e.code==='Space'){ e.preventDefault(); toggle(); }
      else if (e.code==='ArrowRight'){ go(1); }
      else if (e.code==='ArrowLeft'){ go(-1); }
      else if (e.key==='m'||e.key==='M'){ toggleMute(); }
      else if (e.key==='f'||e.key==='F'){ fullscreen(); }
    });
    window.addEventListener('mousemove', wake);
    wake();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
