/** 背景鱼群：12 种程序化绘制的鱼 + 随机差异 + 大鱼吃小鱼 */
window.Fish = (function () {
  'use strict';

  const SPECIES = [
    { id: 'xianyu', name: '咸鱼', rx: 30, ry: 15, c1: '#8ba0b4', c2: '#5d7387', belly: '#c9d6e1', tail: 'fan', dorsal: 'tri', pattern: 'none', droop: true },
    { id: 'goldfish', name: '金鱼', rx: 26, ry: 16, c1: '#ff9d4a', c2: '#e2650f', belly: '#ffd9a8', tail: 'long', dorsal: 'tri', pattern: 'none' },
    { id: 'koi', name: '锦鲤', rx: 32, ry: 15, c1: '#f4efe4', c2: '#e0602c', belly: '#fff8ec', tail: 'fan', dorsal: 'none', pattern: 'patch' },
    { id: 'clown', name: '小丑鱼', rx: 25, ry: 15, c1: '#ff7a2f', c2: '#d64f12', belly: '#ffb877', tail: 'fan', dorsal: 'tri', pattern: 'stripe' },
    { id: 'puffer', name: '河豚', rx: 22, ry: 21, c1: '#d9c07a', c2: '#a8913f', belly: '#f6ecd0', tail: 'fan', dorsal: 'none', pattern: 'dots', spike: true },
    { id: 'tropical', name: '热带鱼', rx: 23, ry: 17, c1: '#ffd447', c2: '#2f7fd6', belly: '#fff2c2', tail: 'tri', dorsal: 'tri', pattern: 'stripe2' },
    { id: 'ribbon', name: '带鱼', rx: 40, ry: 8, c1: '#cedae6', c2: '#8fa6bb', belly: '#f2f7fb', tail: 'tri', dorsal: 'none', pattern: 'none' },
    { id: 'saury', name: '秋刀鱼', rx: 36, ry: 10, c1: '#a9c3d8', c2: '#5f7f9c', belly: '#e8f1f7', tail: 'tri', dorsal: 'tri', pattern: 'none' },
    { id: 'shark', name: '鲨鱼', rx: 36, ry: 14, c1: '#8e939c', c2: '#5f646c', belly: '#d3d6db', tail: 'fluke', dorsal: 'big', pattern: 'none' },
    { id: 'whale', name: '鲸鱼', rx: 40, ry: 20, c1: '#5f86b8', c2: '#3d5f8a', belly: '#bcd2e8', tail: 'fluke', dorsal: 'none', pattern: 'none' },
    { id: 'octopus', name: '章鱼', rx: 24, ry: 20, c1: '#a773c9', c2: '#7b4e9c', belly: '#e0c8f0', tail: 'none', dorsal: 'none', pattern: 'none', tentacle: true },
    { id: 'lantern', name: '灯笼鱼', rx: 26, ry: 14, c1: '#3f4a5c', c2: '#2a3242', belly: '#6d7b91', tail: 'fan', dorsal: 'tri', pattern: 'none', glow: true },
  ];

  const HUNT_SIZE = 92;
  const PREY_RATIO = 0.72;

  let host = null;
  let items = [];
  let huntTimer = null;
  let seq = 0;
  let eatenCount = 0;

  /** 把鱼群状态写到容器属性上，方便调试与自动化检查 */
  function syncStats() {
    if (!host) return;
    host.setAttribute('data-fish', items.length);
    host.setAttribute('data-eaten', eatenCount);
  }

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [h * 360, s, l];
  }

  function hslToRgb(h, s, l) {
    const hn = (((h % 360) + 360) % 360) / 360;
    if (s === 0) {
      const v = Math.round(l * 255);
      return [v, v, v];
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const conv = function (t) {
      let x = t;
      if (x < 0) x += 1;
      if (x > 1) x -= 1;
      if (x < 1 / 6) return p + (q - p) * 6 * x;
      if (x < 1 / 2) return q;
      if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
      return p;
    };
    return [Math.round(conv(hn + 1 / 3) * 255), Math.round(conv(hn) * 255), Math.round(conv(hn - 1 / 3) * 255)];
  }

  function toHex(rgb) {
    return (
      '#' +
      rgb
        .map(function (v) {
          return Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0');
        })
        .join('')
    );
  }

  function shiftColor(hex, dHue, satMul, lightMul) {
    const hsl = rgbToHsl.apply(null, hexToRgb(hex));
    const s = Math.max(0, Math.min(1, hsl[1] * satMul));
    const l = Math.max(0.08, Math.min(0.94, hsl[2] * lightMul));
    return toHex(hslToRgb(hsl[0] + dHue, s, l));
  }

  function tintOf(sp, dHue, satMul, lightMul) {
    return {
      c1: shiftColor(sp.c1, dHue, satMul, lightMul),
      c2: shiftColor(sp.c2, dHue, satMul, lightMul),
      belly: shiftColor(sp.belly, dHue, satMul, lightMul),
    };
  }

  function tailPath(type, cx, cy, rx, c2) {
    const x = cx - rx;
    if (type === 'none') return '';
    if (type === 'long') {
      return '<path d="M' + x + ' ' + cy + ' C' + (x - 22) + ' ' + (cy - 22) + ' ' + (x - 30) + ' ' + (cy + 6) + ' ' + (x - 10) + ' ' + (cy + 2) + ' C' + (x - 26) + ' ' + (cy + 14) + ' ' + (x - 14) + ' ' + (cy + 20) + ' ' + x + ' ' + cy + ' Z" fill="' + c2 + '"/>';
    }
    if (type === 'fluke') {
      return '<path d="M' + x + ' ' + cy + ' C' + (x - 16) + ' ' + (cy - 16) + ' ' + (x - 26) + ' ' + (cy - 18) + ' ' + (x - 22) + ' ' + cy + ' C' + (x - 26) + ' ' + (cy + 18) + ' ' + (x - 16) + ' ' + (cy + 16) + ' ' + x + ' ' + cy + ' Z" fill="' + c2 + '"/>';
    }
    if (type === 'tri') {
      return '<path d="M' + x + ' ' + cy + ' L' + (x - 18) + ' ' + (cy - 15) + ' L' + (x - 18) + ' ' + (cy + 15) + ' Z" fill="' + c2 + '"/>';
    }
    return '<path d="M' + x + ' ' + cy + ' L' + (x - 20) + ' ' + (cy - 18) + ' L' + (x - 12) + ' ' + cy + ' L' + (x - 20) + ' ' + (cy + 18) + ' Z" fill="' + c2 + '"/>';
  }

  function patternPath(kind, cx, cy, rx, ry, c2, uid, stripeGap) {
    if (kind === 'none') return '';
    const clip = '<clipPath id="' + uid + '_c"><ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"/></clipPath>';
    let body = '';
    if (kind === 'stripe' || kind === 'stripe2') {
      const xs = kind === 'stripe' ? [-stripeGap, stripeGap] : [-stripeGap * 1.4, -2, stripeGap];
      body = xs
        .map(function (dx) {
          return '<rect x="' + (cx - 3 + dx) + '" y="' + (cy - ry) + '" width="7" height="' + ry * 2 + '" fill="#ffffff" opacity="0.85"/>';
        })
        .join('');
    } else if (kind === 'patch') {
      body = '<ellipse cx="' + (cx - 6) + '" cy="' + (cy - 4) + '" rx="11" ry="8" fill="' + c2 + '" opacity="0.9"/><ellipse cx="' + (cx + 12) + '" cy="' + (cy + 3) + '" rx="8" ry="6" fill="' + c2 + '" opacity="0.8"/>';
    } else if (kind === 'dots') {
      body = [-14, -2, 10]
        .map(function (dx) {
          return '<circle cx="' + (cx + dx) + '" cy="' + cy + '" r="3" fill="' + c2 + '" opacity="0.75"/>';
        })
        .join('');
    }
    return '<g clip-path="url(#' + uid + '_c)">' + body + '</g><defs>' + clip + '</defs>';
  }

  /**
   * 生成一条鱼的 SVG
   * @param {object} sp 鱼的种类参数
   * @param {object} [tint] 色相偏移结果，见 tintOf()
   * @param {object} [shape] 形变参数 { tailScale, stripeGap }
   */
  function buildSVG(sp, tint, shape) {
    const s = Object.assign({}, sp, tint || {});
    const sh = shape || {};
    const uid = 'fish_' + sp.id + '_' + seq++;
    const cx = 66;
    const cy = 35;
    const rx = s.rx;
    const ry = s.ry;
    const tailScale = sh.tailScale || 1;
    let d = '';

    if (s.glow) {
      d += '<path d="M' + (cx + rx - 2) + ' ' + (cy - 6) + ' L' + (cx + rx + 14) + ' ' + (cy - 14) + '" stroke="#7f8ba0" stroke-width="2" fill="none"/>';
      d += '<circle cx="' + (cx + rx + 16) + '" cy="' + (cy - 15) + '" r="9" fill="url(#' + uid + '_g)"/>';
      d += '<circle cx="' + (cx + rx + 16) + '" cy="' + (cy - 15) + '" r="3" fill="#fff6c8"/>';
    }
    if (s.tentacle) {
      d += '<path d="M' + (cx - 12) + ' ' + (cy + ry - 4) + ' C' + (cx - 22) + ' ' + (cy + ry + 12) + ' ' + (cx - 6) + ' ' + (cy + ry + 16) + ' ' + (cx - 2) + ' ' + (cy + ry + 2) + '" stroke="' + s.c2 + '" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.95"/>';
      d += '<path d="M' + (cx + 2) + ' ' + (cy + ry - 3) + ' C' + (cx - 2) + ' ' + (cy + ry + 14) + ' ' + (cx + 14) + ' ' + (cy + ry + 12) + ' ' + (cx + 12) + ' ' + (cy + ry - 4) + '" stroke="' + s.c2 + '" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.95"/>';
      d += '<path d="M' + (cx + 14) + ' ' + (cy + ry - 6) + ' C' + (cx + 22) + ' ' + (cy + ry + 10) + ' ' + (cx + 30) + ' ' + (cy + ry + 6) + ' ' + (cx + 26) + ' ' + (cy + ry - 8) + '" stroke="' + s.c2 + '" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.95"/>';
    }

    // 尾巴：按 tailScale 单独缩放，得到粗细不同的同种鱼
    d += '<g transform="translate(' + (cx - rx) + ' ' + cy + ') scale(' + tailScale + ') translate(' + -(cx - rx) + ' ' + -cy + ')">';
    d += tailPath(s.tail, cx, cy, rx, s.c2);
    d += '</g>';

    if (s.dorsal === 'tri') {
      d += '<path d="M' + (cx - 12) + ' ' + (cy - ry + 3) + ' L' + (cx + 2) + ' ' + (cy - ry - 14) + ' L' + (cx + 14) + ' ' + (cy - ry + 4) + ' Z" fill="' + s.c2 + '"/>';
    } else if (s.dorsal === 'big') {
      d += '<path d="M' + (cx - 14) + ' ' + (cy - ry + 4) + ' L' + (cx + 4) + ' ' + (cy - ry - 26) + ' L' + (cx + 18) + ' ' + (cy - ry + 5) + ' Z" fill="' + s.c2 + '"/>';
    }

    d += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + s.c1 + '"/>';
    d += '<ellipse cx="' + cx + '" cy="' + (cy + ry * 0.42) + '" rx="' + (rx * 0.82) + '" ry="' + (ry * 0.5) + '" fill="' + s.belly + '" opacity="0.75"/>';
    d += patternPath(s.pattern, cx, cy, rx, ry, s.c2, uid, sh.stripeGap || 8);
    d += '<ellipse cx="' + (cx - 2) + '" cy="' + (cy + ry * 0.55) + '" rx="8" ry="5" fill="' + s.c2 + '" opacity="0.85" transform="rotate(18 ' + (cx - 2) + ' ' + (cy + ry * 0.55) + ')"/>';

    if (s.spike) {
      d += '<circle cx="' + cx + '" cy="' + (cy - ry - 2) + '" r="2.4" fill="' + s.c2 + '"/>';
      d += '<circle cx="' + (cx - 10) + '" cy="' + (cy - ry + 2) + '" r="2" fill="' + s.c2 + '"/>';
    }

    const eyeX = cx + rx - 9;
    d += '<circle cx="' + eyeX + '" cy="' + (cy - 4) + '" r="4.6" fill="#ffffff"/>';
    d += '<circle cx="' + (eyeX + 0.8) + '" cy="' + (cy - 3.4) + '" r="2.4" fill="#20262f"/>';
    if (s.droop) {
      d += '<path d="M' + (eyeX - 6) + ' ' + (cy - 11) + ' L' + (eyeX + 5) + ' ' + (cy - 7) + '" stroke="#3b444f" stroke-width="2" stroke-linecap="round"/>';
    }
    d += '<path d="M' + (cx + rx - 3) + ' ' + (cy + 5) + ' q6 3 2 7" stroke="' + s.c2 + '" stroke-width="2" fill="none" stroke-linecap="round"/>';

    const defs =
      '<defs><radialGradient id="' + uid + '_g"><stop offset="0" stop-color="#fffbe0"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient></defs>';
    return '<svg viewBox="0 0 130 70" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + s.name + '">' + defs + d + '</svg>';
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /** 一条鱼的随机配置：体型分档 + 远近景深 + 色相偏移 + 游速/摆动/倾斜 */
  function makeConfig(tier) {
    const sp = pick(SPECIES);
    const roll = Math.random();
    const t = tier || (roll < 0.28 ? 'big' : roll < 0.72 ? 'mid' : 'small');
    const base = t === 'big' ? rand(96, 138) : t === 'mid' ? rand(70, 96) : rand(44, 70);
    const depth = rand(0.62, 1.28);
    return {
      species: sp,
      tier: t,
      size: Math.round(base * (0.72 + depth * 0.3)),
      top: +rand(4, 88).toFixed(1),
      dir: Math.random() < 0.5 ? 1 : -1,
      dur: +(rand(24, 50) / depth).toFixed(1),
      delay: -rand(0, 50).toFixed(1),
      bob: +rand(2.2, 5.4).toFixed(2),
      wig: +rand(0.7, 1.6).toFixed(2),
      op: +Math.max(0.14, Math.min(0.62, rand(0.22, 0.5) * (0.6 + depth * 0.5))).toFixed(2),
      blur: depth < 0.82 ? +rand(0.5, 1.7).toFixed(2) : 0,
      tilt: +rand(-7, 7).toFixed(1),
      dash: Math.random() < 0.28,
      tint: tintOf(sp, rand(-42, 42), rand(0.72, 1.3), rand(0.86, 1.14)),
      shape: { tailScale: +rand(0.85, 1.25).toFixed(2), stripeGap: Math.round(rand(5, 11)) },
    };
  }

  function elementFor(cfg, appearing) {
    const el = document.createElement('div');
    el.className = 'fish' + (cfg.dir < 0 ? ' left' : '') + (cfg.dash ? ' dash' : '') + (appearing ? ' appearing' : '');
    el.setAttribute('data-species', cfg.species.name);
    el.setAttribute('data-size', cfg.size);
    el.style.setProperty('--top', cfg.top + '%');
    el.style.setProperty('--dur', cfg.dur + 's');
    el.style.setProperty('--delay', cfg.delay + 's');
    el.style.setProperty('--bob', cfg.bob + 's');
    el.style.setProperty('--wig', cfg.wig + 's');
    el.style.setProperty('--op', cfg.op);
    el.style.setProperty('--dir', cfg.dir);
    el.style.setProperty('--size', cfg.size + 'px');
    el.style.setProperty('--tilt', cfg.tilt + 'deg');
    if (cfg.blur) el.style.filter = 'blur(' + cfg.blur + 'px)';
    el.innerHTML =
      '<div class="fish-bob"><div class="fish-flip"><div class="fish-art">' + buildSVG(cfg.species, cfg.tint, cfg.shape) + '</div></div></div>';
    return el;
  }

  function addFish(tier, appearing) {
    const cfg = makeConfig(tier);
    const el = elementFor(cfg, appearing);
    const item = { cfg: cfg, el: el, dead: false };
    cfg.item = item;
    host.appendChild(el);
    items.push(item);
    syncStats();
    return item;
  }

  function removeItem(item) {
    item.dead = true;
    if (item.el.parentNode) item.el.parentNode.removeChild(item.el);
    items = items.filter(function (i) {
      return i !== item;
    });
    syncStats();
  }

  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  }

  function tryEat() {
    if (!host || items.length < 6) return false;
    const hunters = items.filter(function (i) {
      return !i.dead && i.cfg.size >= HUNT_SIZE;
    });
    if (!hunters.length) return false;
    const hunter = pick(hunters);
    const preys = items.filter(function (i) {
      return !i.dead && i !== hunter && i.cfg.size < hunter.cfg.size * PREY_RATIO;
    });
    if (!preys.length) return false;

    const h = centerOf(hunter.el);
    const ahead = preys.filter(function (i) {
      const p = centerOf(i.el);
      return (p.x - h.x) * hunter.cfg.dir > -80 && Math.abs(p.y - h.y) < 140;
    });
    chase(hunter, pick(ahead.length ? ahead : preys));
    return true;
  }

  function chase(hunter, prey) {
    const h = centerOf(hunter.el);
    const p0 = centerOf(prey.el);
    const chaseMs = 680;
    // 小鱼还会继续往前游，瞄准它届时的位置
    const preySpeed = ((138 * window.innerWidth) / 100) / prey.cfg.dur;
    const targetX = p0.x + prey.cfg.dir * preySpeed * (chaseMs / 1000);
    const targetY = p0.y;

    const clone = elementFor(hunter.cfg, false);
    clone.classList.add('fish-chase');
    clone.style.left = h.x - h.w / 2 + 'px';
    clone.style.top = h.y - h.h / 2 + 'px';
    clone.style.width = h.w + 'px';
    clone.style.opacity = getComputedStyle(hunter.el).opacity;
    const face = targetX >= h.x ? 1 : -1;
    clone.style.setProperty('--dir', face);
    host.appendChild(clone);
    hunter.el.style.visibility = 'hidden';

    requestAnimationFrame(function () {
      clone.style.transform = 'translate(' + (targetX - h.x).toFixed(1) + 'px,' + (targetY - h.y).toFixed(1) + 'px)';
    });

    setTimeout(function () {
      clone.classList.add('chomp');
      prey.el.classList.add('eaten');
      eatenCount += 1;
      syncStats();
      setTimeout(function () {
        removeItem(prey);
      }, 380);
      setTimeout(function () {
        // 大鱼从当前位置接回游动动画：用负的 animation-delay 让它无缝继续
        const span = 1.38 * window.innerWidth;
        const passed = Math.max(0, Math.min(span, targetX + 0.2 * window.innerWidth));
        const next = addFish(hunter.cfg.tier, true);
        next.cfg.dir = face;
        next.el.classList.toggle('left', face === -1);
        next.el.classList.toggle('dash', hunter.cfg.dash);
        next.el.style.setProperty('--top', ((targetY / window.innerHeight) * 100).toFixed(1) + '%');
        next.el.style.setProperty('--dir', face);
        next.el.style.setProperty('--delay', (-(passed / span) * hunter.cfg.dur).toFixed(2) + 's');
        removeItem(hunter);
        if (clone.parentNode) clone.parentNode.removeChild(clone);
        setTimeout(function () {
          if (items.length < 14) addFish('small', true);
        }, rand(600, 2200));
      }, 300);
    }, chaseMs);
  }

  function scheduleHunt() {
    clearTimeout(huntTimer);
    huntTimer = setTimeout(function () {
      if (!document.hidden) {
        try {
          tryEat();
        } catch (err) {
          /* 吃鱼失败不影响背景 */
        }
      }
      scheduleHunt();
    }, rand(4500, 11000));
  }

  /**
   * 在容器里放一群鱼并开始「大鱼吃小鱼」
   * @param {HTMLElement} container
   * @param {number} [count] 默认 12 条，最少 10 条
   */
  function spawn(container, count) {
    if (!container) return 0;
    if (reducedMotion()) return 0;
    host = container;
    items = [];
    eatenCount = 0;
    host.innerHTML = '';
    const total = Math.max(10, count || 12);
    for (let i = 0; i < total; i++) addFish();
    syncStats();
    scheduleHunt();
    return total;
  }

  function stop() {
    clearTimeout(huntTimer);
    items = [];
    if (host) host.innerHTML = '';
  }

  return {
    SPECIES: SPECIES,
    buildSVG: buildSVG,
    spawn: spawn,
    stop: stop,
  };
})();
