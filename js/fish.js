/**
 * 背景鱼群：程序化绘制 + 随机游动。
 * 鱼的形状由「体型 + 尾型 + 花纹 + 背鳍」参数组合而成，不加载任何图片。
 */
window.Fish = (function () {
  'use strict';

  /** 12 种鱼：体型、配色、尾型、花纹各不相同 */
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

  function tailPath(type, cx, cy, rx) {
    const x = cx - rx;
    if (type === 'none') return '';
    if (type === 'long') {
      return (
        '<path d="M' + x + ' ' + cy + ' C' + (x - 22) + ' ' + (cy - 22) + ' ' + (x - 30) + ' ' + (cy + 6) +
        ' ' + (x - 10) + ' ' + (cy + 2) + ' C' + (x - 26) + ' ' + (cy + 14) + ' ' + (x - 14) + ' ' + (cy + 20) +
        ' ' + x + ' ' + cy + ' Z" fill="T2"/>'
      );
    }
    if (type === 'fluke') {
      return (
        '<path d="M' + x + ' ' + cy + ' C' + (x - 16) + ' ' + (cy - 16) + ' ' + (x - 26) + ' ' + (cy - 18) +
        ' ' + (x - 22) + ' ' + cy + ' C' + (x - 26) + ' ' + (cy + 18) + ' ' + (x - 16) + ' ' + (cy + 16) +
        ' ' + x + ' ' + cy + ' Z" fill="T2"/>'
      );
    }
    if (type === 'tri') {
      return '<path d="M' + x + ' ' + cy + ' L' + (x - 18) + ' ' + (cy - 15) + ' L' + (x - 18) + ' ' + (cy + 15) + ' Z" fill="T2"/>';
    }
    return '<path d="M' + x + ' ' + cy + ' L' + (x - 20) + ' ' + (cy - 18) + ' L' + (x - 12) + ' ' + cy + ' L' + (x - 20) + ' ' + (cy + 18) + ' Z" fill="T2"/>';
  }

  function patternPath(kind, cx, cy, rx, ry, sp, uid) {
    if (kind === 'none') return '';
    const clip = '<clipPath id="' + uid + '_c"><ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"/></clipPath>';
    let body = '';
    if (kind === 'stripe' || kind === 'stripe2') {
      const xs = kind === 'stripe' ? [-8, 8] : [-12, -2, 8];
      body = xs
        .map(function (dx) {
          return '<rect x="' + (cx - 3 + dx) + '" y="' + (cy - ry) + '" width="7" height="' + ry * 2 + '" fill="#ffffff" opacity="0.85"/>';
        })
        .join('');
    } else if (kind === 'patch') {
      body =
        '<ellipse cx="' + (cx - 6) + '" cy="' + (cy - 4) + '" rx="11" ry="8" fill="' + sp.c2 + '" opacity="0.9"/>' +
        '<ellipse cx="' + (cx + 12) + '" cy="' + (cy + 3) + '" rx="8" ry="6" fill="' + sp.c2 + '" opacity="0.8"/>';
    } else if (kind === 'dots') {
      body = [-14, -2, 10]
        .map(function (dx) {
          return '<circle cx="' + (cx + dx) + '" cy="' + cy + '" r="3" fill="' + sp.c2 + '" opacity="0.75"/>';
        })
        .join('');
    }
    return '<g clip-path="url(#' + uid + '_c)">' + body + '</g><defs>' + clip + '</defs>';
  }

  /** 生成一条鱼的 SVG 字符串，所有坐标相对 viewBox 0 0 130 70 */
  function buildSVG(sp) {
    const uid = 'fish_' + sp.id;
    const cx = 66;
    const cy = 35;
    const rx = sp.rx;
    const ry = sp.ry;
    let out = '<svg viewBox="0 0 130 70" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + sp.name + '">';
    out += '<defs><radialGradient id="' + uid + '_g"><stop offset="0" stop-color="#fffbe0"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient></defs>';

    if (sp.glow) {
      out += '<path d="M' + (cx + rx - 2) + ' ' + (cy - 6) + ' L' + (cx + rx + 14) + ' ' + (cy - 14) + '" stroke="#7f8ba0" stroke-width="2" fill="none"/>';
      out += '<circle cx="' + (cx + rx + 16) + '" cy="' + (cy - 15) + '" r="9" fill="url(#' + uid + '_g)"/>';
      out += '<circle cx="' + (cx + rx + 16) + '" cy="' + (cy - 15) + '" r="3" fill="#fff6c8"/>';
    }

    if (sp.tentacle) {
      out += '<path d="M' + (cx - 12) + ' ' + (cy + ry - 4) + ' C' + (cx - 22) + ' ' + (cy + ry + 12) + ' ' + (cx - 6) + ' ' + (cy + ry + 16) + ' ' + (cx - 2) + ' ' + (cy + ry + 2) +
        ' M' + (cx + 2) + ' ' + (cy + ry - 3) + ' C' + (cx - 2) + ' ' + (cy + ry + 14) + ' ' + (cx + 14) + ' ' + (cy + ry + 12) + ' ' + (cx + 12) + ' ' + (cy + ry - 4) +
        ' M' + (cx + 14) + ' ' + (cy + ry - 6) + ' C' + (cx + 22) + ' ' + (cy + ry + 10) + ' ' + (cx + 30) + ' ' + (cy + ry + 6) + ' ' + (cx + 26) + ' ' + (cy + ry - 8) +
        '" stroke="' + sp.c2 + '" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.95"/>';
    }

    out += tailPath(sp.tail, cx, cy, rx).replace(/T2/g, sp.c2);

    if (sp.dorsal === 'tri') {
      out += '<path d="M' + (cx - 12) + ' ' + (cy - ry + 3) + ' L' + (cx + 2) + ' ' + (cy - ry - 14) + ' L' + (cx + 14) + ' ' + (cy - ry + 4) + ' Z" fill="' + sp.c2 + '"/>';
    } else if (sp.dorsal === 'big') {
      out += '<path d="M' + (cx - 14) + ' ' + (cy - ry + 4) + ' L' + (cx + 4) + ' ' + (cy - ry - 26) + ' L' + (cx + 18) + ' ' + (cy - ry + 5) + ' Z" fill="' + sp.c2 + '"/>';
    }

    out += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + sp.c1 + '"/>';
    out += '<ellipse cx="' + cx + '" cy="' + (cy + ry * 0.42) + '" rx="' + (rx * 0.82) + '" ry="' + (ry * 0.5) + '" fill="' + sp.belly + '" opacity="0.75"/>';
    out += patternPath(sp.pattern, cx, cy, rx, ry, sp, uid);

    // 胸鳍
    out += '<ellipse cx="' + (cx - 2) + '" cy="' + (cy + ry * 0.55) + '" rx="8" ry="5" fill="' + sp.c2 + '" opacity="0.85" transform="rotate(18 ' + (cx - 2) + ' ' + (cy + ry * 0.55) + ')"/>';

    if (sp.spike) {
      out += '<circle cx="' + cx + '" cy="' + (cy - ry - 2) + '" r="2.4" fill="' + sp.c2 + '"/>' +
        '<circle cx="' + (cx - 10) + '" cy="' + (cy - ry + 2) + '" r="2" fill="' + sp.c2 + '"/>';
    }

    // 眼睛
    const eyeX = cx + rx - 9;
    out += '<circle cx="' + eyeX + '" cy="' + (cy - 4) + '" r="4.6" fill="#ffffff"/>';
    out += '<circle cx="' + (eyeX + 0.8) + '" cy="' + (cy - 3.4) + '" r="2.4" fill="#20262f"/>';
    if (sp.droop) {
      out += '<path d="M' + (eyeX - 6) + ' ' + (cy - 11) + ' L' + (eyeX + 5) + ' ' + (cy - 7) + '" stroke="#3b444f" stroke-width="2" stroke-linecap="round"/>';
    }

    // 嘴
    out += '<path d="M' + (cx + rx - 3) + ' ' + (cy + 5) + ' q6 3 2 7" stroke="' + sp.c2 + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
    out += '</svg>';
    return out;
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  /**
   * 在容器里随机放一群鱼。
   * @param {HTMLElement} container
   * @param {number} [count] 默认 12 条，最少 10 条
   * @returns {number} 实际生成数量
   */
  function spawn(container, count) {
    if (!container) return 0;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
    const total = Math.max(10, count || 12);
    let html = '';
    for (let i = 0; i < total; i++) {
      const sp = SPECIES[Math.floor(Math.random() * SPECIES.length)];
      const dir = Math.random() < 0.5 ? 1 : -1;
      const size = rand(46, 118) * (sp.id === 'whale' ? 1.35 : 1);
      const top = rand(4, 88).toFixed(1);
      const dur = rand(22, 52).toFixed(1);
      const delay = (-rand(0, 52)).toFixed(1);
      const bob = rand(2.4, 5.2).toFixed(2);
      const wig = rand(0.75, 1.5).toFixed(2);
      const op = rand(0.22, 0.5).toFixed(2);
      html +=
        '<div class="fish' + (dir < 0 ? ' left' : '') + '" style="--top:' + top + '%;--dur:' + dur + 's;--delay:' + delay +
        's;--bob:' + bob + 's;--wig:' + wig + 's;--op:' + op + ';--dir:' + dir + ';--size:' + size.toFixed(0) + 'px">' +
        '<div class="fish-bob"><div class="fish-flip"><div class="fish-art">' + buildSVG(sp) + '</div></div></div>' +
        '</div>';
    }
    container.innerHTML = html;
    return total;
  }

  return {
    SPECIES: SPECIES,
    buildSVG: buildSVG,
    spawn: spawn,
  };
})();
