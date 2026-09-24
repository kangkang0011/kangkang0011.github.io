/**
 * 界面渲染与抽卡演出
 */
window.UI = (function () {
  'use strict';

  const D = window.GameData;
  const C = D.CONFIG;
  const E = D.ELEMENTS;
  const G = window.Gacha;

  const RARITY_CLASS = { 5: 'r5', 4: 'r4', 3: 'r3' };

  function $(id) {
    return document.getElementById(id);
  }

  function fmt(n) {
    return Number(n).toLocaleString('zh-CN');
  }

  function pct(n, digits) {
    return (n * 100).toFixed(digits === undefined ? 2 : digits) + '%';
  }

  function esc(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  function mix(hex, target, t) {
    const a = hexToRgb(hex);
    const b = hexToRgb(target);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bl = Math.round(a.b + (b.b - a.b) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  /**
   * 程序化立绘：由角色 id 推导配色、光线角度与几何构图，
   * 所以每个角色都有独属于自己的卡面，且不依赖任何外部图片素材。
   */
  function portrait(item) {
    const h = G.hashString(item.id);
    const el = E[item.element] || E.slack;
    const uid = 'p_' + item.id;
    const angle = h % 360;
    const c1 = mix(el.color, '#ffffff', 0.15);
    const c2 = mix(el.color, '#05060a', 0.72);
    const c3 = mix(el.color, item.rarity === 5 ? '#ffd98a' : '#0b0e14', item.rarity === 5 ? 0.55 : 0.85);
    const orbX = 90 + (h % 120);
    const orbY = 150 + ((h >> 3) % 110);
    const orbR = 70 + ((h >> 6) % 50);
    const isChar = item.rarity >= 4;
    const glyph = isChar ? el.icon : '🗂';

    const figure = isChar
      ? '<path d="M150 118c26 0 44 20 44 46s-18 48-44 48-44-22-44-48 18-46 44-46z" fill="' +
        mix(el.color, '#ffffff', 0.55) +
        '" opacity="0.92"/>' +
        '<path d="M66 400c0-58 36-104 84-104s84 46 84 104z" fill="' +
        mix(el.color, '#000000', 0.35) +
        '" opacity="0.85"/>'
      : '<rect x="86" y="150" width="128" height="150" rx="26" transform="rotate(' +
        (((h >> 9) % 24) - 12) +
        ' 150 225)" fill="' +
        mix(el.color, '#ffffff', 0.25) +
        '" opacity="0.85"/>' +
        '<rect x="112" y="184" width="76" height="26" rx="13" fill="rgba(0,0,0,.35)"/>';

    return (
      '<svg class="portrait" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' +
      esc(item.name) +
      '的立绘">' +
      '<defs>' +
      '<linearGradient id="' + uid + '_bg" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/>' +
      '</linearGradient>' +
      '<radialGradient id="' + uid + '_orb" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0" stop-color="' + mix(el.color, '#ffffff', 0.6) + '" stop-opacity="0.85"/>' +
      '<stop offset="1" stop-color="' + c3 + '" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<linearGradient id="' + uid + '_shine" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset="0.5" stop-color="#fff" stop-opacity="0.28"/>' +
      '<stop offset="1" stop-color="#fff" stop-opacity="0"/>' +
      '</linearGradient>' +
      '</defs>' +
      '<rect width="300" height="400" fill="url(#' + uid + '_bg)"/>' +
      '<g opacity="0.5" transform="rotate(' + angle + ' 150 200)">' +
      '<circle cx="' + orbX + '" cy="' + orbY + '" r="' + orbR + '" fill="url(#' + uid + '_orb)"/>' +
      '</g>' +
      figure +
      '<rect x="-120" y="' + (60 + (h % 200)) + '" width="540" height="46" fill="url(#' + uid + '_shine)" transform="rotate(-18 150 200)"/>' +
      '<text x="150" y="252" text-anchor="middle" font-size="96" opacity="0.95">' + glyph + '</text>' +
      '<text x="150" y="366" text-anchor="middle" font-size="26" letter-spacing="6" fill="rgba(255,255,255,.75)">' +
      esc(item.name.slice(0, 4)) +
      '</text>' +
      '<text x="150" y="392" text-anchor="middle" font-size="15" fill="rgba(255,255,255,.45)">' +
      esc(el.name + '系') +
      '</text>' +
      '</svg>'
    );
  }

  function stars(rarity) {
    return '★'.repeat(rarity);
  }

  /** 图鉴 / 卡池展示用的小卡 */
  function miniCard(item, extra) {
    const el = E[item.element];
    const emp = G.employee(item.id);
    return (
      '<article class="mcard ' + RARITY_CLASS[item.rarity] + '" style="--accent:' + el.color + '">' +
      '<div class="mcard-art">' + portrait(item) + '</div>' +
      '<div class="mcard-star">' + stars(item.rarity) + '</div>' +
      '<div class="mcard-name">' + esc(item.name) + '</div>' +
      (extra || '') +
      '<div class="mcard-code">' + esc(emp.code) + '</div>' +
      '</article>'
    );
  }

  function resultCard(result, index) {
    const item = result.item;
    const el = E[item.element];
    const emp = G.employee(item.id);
    const badges =
      (result.isUp ? '<span class="badge up">UP</span>' : '') +
      (result.isNew ? '<span class="badge new">NEW</span>' : '');
    return (
      '<article class="rcard ' + RARITY_CLASS[result.rarity] + '" style="--accent:' + el.color + '">' +
      '<div class="rcard-glow"></div>' +
      '<div class="rcard-art">' + portrait(item) + '</div>' +
      '<div class="rcard-body">' +
      '<div class="rcard-star">' + stars(result.rarity) + '</div>' +
      '<div class="rcard-name">' + esc(item.name) + '</div>' +
      '<div class="rcard-meta">' + el.icon + ' ' + esc(el.name) + (item.dept ? ' · ' + esc(item.dept) : '') + '</div>' +
      '<div class="rcard-code">工号 ' + esc(emp.code) + '</div>' +
      (badges ? '<div class="rcard-badges">' + badges + '</div>' : '') +
      '</div>' +
      '</article>'
    );
  }

  function renderTopbar(state) {
    $('currencyValue').textContent = fmt(state.currency);
    const remain = window.SaveState.monthlyRemainDays(state);
    $('monthlyChip').hidden = remain <= 0;
    if (remain > 0) $('monthlyChip').textContent = '月卡 ' + remain + ' 天';
    const ach = window.Achievements.summary(state);
    const badge = $('achBadge');
    if (badge) {
      badge.textContent = ach.count + '/' + ach.total;
      badge.classList.toggle('full', ach.count === ach.total);
    }
  }

  function renderTabs(state) {
    const box = $('poolTabs');
    box.innerHTML = D.POOLS.map(function (p) {
      const cls = p.id === state.activePool ? 'tab active' : 'tab';
      return (
        '<button class="' + cls + '" data-pool="' + p.id + '">' +
        '<span class="tab-tag">' + esc(p.tag) + '</span>' +
        '<span class="tab-name">' + esc(p.name) + '</span>' +
        '</button>'
      );
    }).join('');
  }

  function renderBanner(state) {
    const pool = D.poolById(state.activePool);
    const s = state.pools[pool.id];
    $('banner').setAttribute('data-theme', pool.theme);
    $('bannerTag').textContent = pool.tag;
    $('bannerTitle').textContent = pool.name;
    $('bannerSub').textContent = pool.sub;
    $('bannerNotes').innerHTML = pool.notes.map(function (n) {
      return '<li>' + esc(n) + '</li>';
    }).join('');

    const upItems = pool.up5.concat(pool.up4).map(function (id) {
      return D.itemById(id);
    });
    const show = upItems.length ? upItems : pool.standard5.slice(0, 3).map(function (id) {
      return D.itemById(id);
    });
    $('bannerCards').innerHTML = show.map(function (item) {
      const tag = item.rarity === 5 ? '<span class="mcard-tag up">UP</span>' : '';
      return miniCard(item, tag);
    }).join('');

    const total = fmt(s.total);
    $('bannerStat').textContent = '本池已抽 ' + total + ' 次 · 已出五星 ' + s.count5 + ' 次';
  }

  function renderPity(state) {
    const pool = D.poolById(state.activePool);
    const s = state.pools[pool.id];
    const hard = pool.five.hardPity;
    const soft = pool.five.softStart;

    $('pity5Text').textContent = s.pity5 + ' / ' + hard;
    $('pity5Fill').style.width = Math.min(100, (s.pity5 / hard) * 100) + '%';
    $('pity5Fill').classList.toggle('soft', s.pity5 >= soft);

    $('pity4Text').textContent = s.pity4 + ' / ' + pool.four.hardPity;
    $('pity4Fill').style.width = Math.min(100, (s.pity4 / pool.four.hardPity) * 100) + '%';

    const tag = $('guaranteeTag');
    const hasUp = pool.up5.length > 0;
    tag.hidden = !(hasUp && s.guaranteed5);
    $('pityHint').textContent = hasUp
      ? (s.guaranteed5
          ? '大保底生效中：下一次五星必定是「' + D.itemById(pool.up5[0]).name + '」'
          : '小保底：下一次五星有 50% 概率为「' + D.itemById(pool.up5[0]).name + '」')
      : '常驻祈愿：五星在六位常驻打工者中随机产生';
  }

  function renderCosts(state) {
    const pool = D.poolById(state.activePool);
    $('cost1').textContent = fmt(C.pullCost.single);
    $('cost10').textContent = fmt(C.pullCost.ten);
    const s = state.pools[pool.id];
    $('btnPull1').disabled = false;
    $('pullCount').textContent = '累计 ' + fmt(s.total) + ' 抽';
  }

  function renderAll(state) {
    renderTopbar(state);
    renderTabs(state);
    renderBanner(state);
    renderPity(state);
    renderCosts(state);
  }

  /* ---------------- 弹层 ---------------- */

  function openModal(title, html) {
    $('modalTitle').textContent = title;
    $('modalBody').innerHTML = html;
    $('modal').hidden = false;
    document.body.classList.add('no-scroll');
  }

  function closeModal() {
    $('modal').hidden = true;
    document.body.classList.remove('no-scroll');
  }

  function isModalOpen() {
    return !$('modal').hidden;
  }

  function statBlock(label, value, hint) {
    return (
      '<div class="stat"><div class="stat-label">' + esc(label) + '</div>' +
      '<div class="stat-value">' + esc(value) + '</div>' +
      (hint ? '<div class="stat-hint">' + esc(hint) + '</div>' : '') +
      '</div>'
    );
  }

  function statsHTML(state) {
    const sum = G.summarize(state.pools);
    const avgCost = sum.total ? state.spendCurrency / sum.total : 0;
    const monthly = state.topup.monthly;

    const poolRows = D.POOLS.map(function (p) {
      const s = state.pools[p.id];
      return (
        '<tr><td>' + esc(p.name) + '</td><td>' + fmt(s.total) + '</td><td>' + s.count5 +
        '</td><td>' + (s.total ? pct(s.count5 / s.total) : '0.00%') + '</td><td>' + s.pity5 + '</td></tr>'
      );
    }).join('');

    const recent = [];
    D.POOLS.forEach(function (p) {
      state.pools[p.id].history.forEach(function (h) {
        recent.push(Object.assign({ pool: p.tag }, h));
      });
    });
    recent.sort(function (a, b) {
      return b.ts - a.ts;
    });
    const recentRows = recent.slice(0, 40).map(function (h) {
      const item = D.itemById(h.id) || { element: 'slack' };
      const el = E[item.element] || E.slack;
      return (
        '<li class="log r' + h.rarity + '">' +
        '<span class="log-star">' + stars(h.rarity) + '</span>' +
        '<span class="log-name">' + esc(h.name) + '</span>' +
        '<span class="log-el">' + el.icon + '</span>' +
        '<span class="log-pool">' + esc(h.pool) + '</span>' +
        '<span class="log-n">第 ' + h.n + ' 抽</span>' +
        '</li>'
      );
    }).join('');

    return (
      '<div class="stats-grid">' +
      statBlock('总抽数', fmt(sum.total)) +
      statBlock('五星数量', fmt(sum.five), '综合出金率 ' + pct(sum.rate5)) +
      statBlock('四星数量', fmt(sum.four), '综合出紫率 ' + pct(sum.rate4)) +
      statBlock('平均出金', sum.five ? sum.avgPullsPer5.toFixed(1) + ' 抽' : '--', '每获得一个五星的平均抽数') +
      statBlock('累计消耗', '¥' + fmt(state.spendCurrency), '单抽均价 ¥' + avgCost.toFixed(1)) +
      statBlock('模拟充值', '¥' + fmt(state.topup.total), '未发生任何真实支付') +
      statBlock('打工次数', fmt(state.workCount), '白嫖共 ' + fmt(state.workCount * C.workReward) + ' 工资') +
      statBlock('月卡', monthly.active ? '生效中' : '未开通', window.SaveState.monthlyRemainDays(state) + ' 天后到期') +
      '</div>' +
      '<h3 class="sub">分卡池统计</h3>' +
      '<table class="table"><thead><tr><th>卡池</th><th>抽数</th><th>五星</th><th>出金率</th><th>当前保底</th></tr></thead>' +
      '<tbody>' + poolRows + '</tbody></table>' +
      '<h3 class="sub">抽卡记录<span class="muted">（最近 40 条）</span></h3>' +
      (recentRows ? '<ul class="log-list">' + recentRows + '</ul>' : '<p class="muted">还没有抽卡记录，先去来一发吧。</p>')
    );
  }

  function bookHTML(state) {
    const groups = [5, 4, 3];
    const total = D.ALL.length;
    const ownedCount = D.ALL.filter(function (i) {
      return state.owned[i.id];
    }).length;

    const sections = groups.map(function (r) {
      const items = D.ALL.filter(function (i) {
        return i.rarity === r;
      });
      const got = items.filter(function (i) {
        return state.owned[i.id];
      }).length;
      const cards = items.map(function (item) {
        const count = state.owned[item.id] || 0;
        const extra = count
          ? '<div class="mcard-count">×' + count + '</div>'
          : '<div class="mcard-lock">未获得</div>';
        return miniCard(item, extra).replace('class="mcard ', 'class="mcard ' + (count ? 'owned ' : 'locked '));
      }).join('');
      return (
        '<h3 class="sub">' + stars(r) + ' 稀有度 <span class="muted">' + got + ' / ' + items.length + '</span></h3>' +
        '<div class="card-grid">' + cards + '</div>'
      );
    }).join('');

    return (
      '<p class="book-head">已收集 <b>' + ownedCount + '</b> / ' + total +
      '　·　全部角色与物品均为《不想上班》原创内容</p>' + sections
    );
  }

  function achievementsHTML(state) {
    const A = window.Achievements;
    const m = A.metrics(state);
    const sum = A.summary(state);
    const unlocked = state.ach.unlocked || {};
    const pctDone = sum.total ? (sum.count / sum.total) * 100 : 0;

    const groups = [];
    D.ACHIEVEMENTS.forEach(function (a) {
      if (groups.indexOf(a.group) === -1) groups.push(a.group);
    });

    const sections = groups.map(function (group) {
      const list = D.ACHIEVEMENTS.filter(function (a) {
        return a.group === group;
      });
      const got = list.filter(function (a) {
        return unlocked[a.id];
      }).length;
      const rows = list.map(function (ach) {
        const p = A.progress(ach, m);
        const done = !!unlocked[ach.id];
        const valueText =
          ach.op === 'lte'
            ? p.value > 0
              ? p.value + ' / ' + p.target + ' 抽内'
              : '--'
            : Math.min(p.value, p.target) + ' / ' + p.target;
        return (
          '<li class="ach' + (done ? ' done' : '') + '">' +
          '<div class="ach-mark">' + (done ? '🏆' : '·') + '</div>' +
          '<div class="ach-main">' +
          '<div class="ach-title"><b>' + esc(ach.name) + '</b>' +
          '<span class="ach-points">+' + ach.points + ' 点</span>' +
          '<span class="ach-gain">¥' + fmt(ach.reward) + '</span></div>' +
          '<div class="ach-desc">' + esc(ach.desc) + '</div>' +
          '<div class="ach-bar"><i style="width:' + (done ? 100 : p.ratio * 100).toFixed(1) + '%"></i></div>' +
          '<div class="ach-progress">' + esc(valueText) + (done ? ' · 已达成' : '') + '</div>' +
          '</div></li>'
        );
      }).join('');
      return (
        '<h3 class="sub">' + esc(group) + '<span class="muted"> ' + got + ' / ' + list.length + '</span></h3>' +
        '<ul class="ach-list">' + rows + '</ul>'
      );
    }).join('');

    return (
      '<div class="ach-summary">' +
      '<div><span class="muted">成就点</span><b>' + fmt(sum.points) + '</b>' +
      '<span class="muted"> / ' + fmt(sum.maxPoints) + '</span></div>' +
      '<div><span class="muted">已达成</span><b>' + sum.count + '</b><span class="muted"> / ' + sum.total + '</span></div>' +
      '</div>' +
      '<div class="ach-overall"><i style="width:' + pctDone.toFixed(1) + '%"></i></div>' +
      sections
    );
  }

  function shopHTML(state) {
    const shop = D.SHOP;
    const tiers = shop.tiers.map(function (t) {
      const first = !state.topup.firstUsed[t.id];
      const gained = t.base + (first ? t.base : 0);
      return (
        '<button class="tier" data-tier="' + t.id + '">' +
        (t.tag ? '<span class="tier-tag">' + esc(t.tag) + '</span>' : '') +
        (first ? '<span class="tier-first">首充双倍</span>' : '') +
        '<span class="tier-amount">' + fmt(gained) + '</span>' +
        '<span class="tier-unit">工资</span>' +
        '<span class="tier-price">¥' + t.price + '</span>' +
        '</button>'
      );
    }).join('');

    const totalPulls = Math.floor(state.currency / C.pullCost.single);
    const card = shop.monthly;
    const remain = window.SaveState.monthlyRemainDays(state);

    return (
      '<div class="shop-balance">当前余额 <b>¥' + fmt(state.currency) + '</b>' +
      '<span class="muted">可抽 ' + fmt(totalPulls) + ' 次</span></div>' +
      '<h3 class="sub">工资充值</h3>' +
      '<div class="tier-grid">' + tiers + '</div>' +
      '<h3 class="sub">' + esc(card.name) + '</h3>' +
      '<div class="monthly-card">' +
      '<div class="monthly-info"><strong>' + esc(card.name) + '</strong>' +
      '<p>' + esc(card.desc) + '</p>' +
      (remain > 0 ? '<p class="muted">剩余 ' + remain + ' 天</p>' : '') +
      '</div>' +
      '<button class="btn buy" data-monthly="1">¥' + card.price + '</button>' +
      '</div>' +
      '<p class="disclaimer">本页面是纯娱乐的模拟充值，点击后不会产生任何真实支付，' +
      '不收集支付信息，也不会向你收取任何费用。数据仅保存在你自己的浏览器里。</p>' +
      '<div class="shop-extra">' +
      '<span>累计模拟充值 <b>¥' + fmt(state.topup.total) + '</b></span>' +
      '<span class="muted">免费获取工资：点右上角「上个班」</span>' +
      '</div>'
    );
  }

  function settingsHTML(state) {
    return (
      '<div class="setting-row">' +
      '<div><strong>跳过抽卡动画</strong><p class="muted">直接展示结果，适合连续抽卡</p></div>' +
      '<button class="switch ' + (state.skipAnim ? 'on' : '') + '" data-toggle="skip">' +
      '<span class="knob"></span></button>' +
      '</div>' +
      '<div class="setting-row">' +
      '<div><strong>音效</strong><p class="muted">抽卡、出金、落卡与成就提示音，由 Web Audio 实时合成，不加载任何音频文件</p></div>' +
      '<button class="switch ' + (state.sound ? 'on' : '') + '" data-toggle="sound">' +
      '<span class="knob"></span></button>' +
      '</div>' +
      '<div class="setting-row">' +
      '<div><strong>导出存档</strong><p class="muted">把抽卡记录与资源保存成 JSON 文件</p></div>' +
      '<button class="btn" data-action="export">导出</button>' +
      '</div>' +
      '<div class="setting-row">' +
      '<div><strong>导入存档</strong><p class="muted">从 JSON 文件恢复进度</p></div>' +
      '<label class="btn"><input type="file" id="importFile" accept="application/json" hidden>导入</label>' +
      '</div>' +
      '<div class="setting-row danger">' +
      '<div><strong>重置存档</strong><p class="muted">清空全部记录、图鉴与余额，回到初始状态</p></div>' +
      '<button class="btn danger-btn" data-action="reset">重置</button>' +
      '</div>' +
      '<div class="setting-row">' +
      '<div><strong>关于</strong><p class="muted">《不想上班》打工人抽卡模拟器 v' + esc(C.version) +
      ' · 全部角色、物品与文案均为原创，' +
      '与任何真实游戏、公司及人物无关。</p></div>' +
      '</div>'
    );
  }

  function confirmHTML(title, lines, confirmText, dataAttr) {
    return (
      '<div class="confirm">' +
      '<h3>' + esc(title) + '</h3>' +
      lines.map(function (l) {
        return '<p>' + l + '</p>';
      }).join('') +
      '<div class="confirm-actions">' +
      '<button class="btn" data-action="cancel">取消</button>' +
      '<button class="btn buy" ' + dataAttr + '>' + esc(confirmText) + '</button>' +
      '</div></div>'
    );
  }

  /* ---------------- 抽卡演出 ---------------- */

  const pull = {
    timers: [],
    results: null,
    opts: {},
    phase: 'idle',
    spotIndex: -1,
    layer: null,
    pop: null,
    resolve: null,
  };

  // 演出节奏：五星更慢更隆重，四星稍快
  const TIMING = {
    5: { burst: 1700, burstFast: 200, hold: 950, fly: 780, big: 430, maxHeightRatio: 0.92 },
    4: { burst: 760, burstFast: 120, hold: 620, fly: 600, big: 320, maxHeightRatio: 0.78 },
  };

  function clearPullTimers() {
    pull.timers.forEach(function (t) {
      clearTimeout(t);
    });
    pull.timers = [];
  }

  function slotAt(index) {
    return document.querySelector('#pullStage .rcard-slot[data-i="' + index + '"]');
  }

  function pickSpotlight(results) {
    for (let i = 0; i < results.length; i++) {
      if (results[i].rarity === 5) return i;
    }
    for (let i = 0; i < results.length; i++) {
      if (results[i].rarity === 4) return i;
    }
    return -1;
  }

  function playPull(results, options) {
    const opts = options || {};
    const overlay = $('pullOverlay');
    const maxRarity = results.reduce(function (m, r) {
      return Math.max(m, r.rarity);
    }, 3);
    const five = results.filter(function (r) {
      return r.rarity === 5;
    }).length;
    const four = results.filter(function (r) {
      return r.rarity === 4;
    }).length;

    clearPullTimers();
    pull.results = results;
    pull.opts = opts;
    pull.phase = 'burst';
    pull.spotIndex = -1;
    pull.layer = null;
    pull.pop = null;

    overlay.hidden = false;
    overlay.className = 'overlay show r' + maxRarity;
    document.body.classList.add('no-scroll');
    $('pullStage').innerHTML =
      '<div class="burst"><span class="burst-core"></span>' +
      '<span class="burst-ring"></span><span class="burst-ring d2"></span>' +
      '<span class="burst-rays"></span></div>' +
      '<div class="burst-text">' + (five ? '金 光 乍 现' : four ? '紫 色 微 光' : '微 光') + '</div>';
    $('pullSkip').hidden = false;
    $('pullContinue').hidden = true;
    $('pullSkip').onclick = skipCurrent;
    if (window.Sound) window.Sound.play(opts.fast ? 'sparkle' : 'burst' + maxRarity);

    return new Promise(function (resolve) {
      pull.resolve = resolve;
      const t = TIMING[maxRarity] || TIMING[4];
      pull.timers.push(setTimeout(toReveal, opts.fast ? t.burstFast : t.burst));
    });
  }

  function buildGrid(results) {
    const many = results.length > 1;
    $('pullStage').innerHTML =
      '<div class="result-wrap ' + (many ? 'ten' : 'one') + '">' +
      results.map(function (r, i) {
        return '<div class="rcard-slot pending" data-i="' + i + '">' + resultCard(r, i) + '</div>';
      }).join('') +
      '</div>';
  }

  function toReveal() {
    if (pull.phase !== 'burst') return;
    clearPullTimers();
    buildGrid(pull.results);

    const rarest = pickSpotlight(pull.results);
    if (pull.opts.fast || rarest < 0) {
      revealAll();
      completeReveal();
      return;
    }
    startSpotlight(rarest);
  }

  function revealAll() {
    const slots = document.querySelectorAll('#pullStage .rcard-slot');
    slots.forEach(function (slot, i) {
      slot.classList.remove('pending');
      slot.style.animationDelay = i * 70 + 'ms';
      slot.classList.add('in');
    });
    pull.phase = 'reveal';
  }

  function revealRest(exceptIndex) {
    const slots = document.querySelectorAll('#pullStage .rcard-slot');
    let k = 0;
    slots.forEach(function (slot, i) {
      if (i === exceptIndex) return;
      slot.classList.remove('pending');
      slot.style.animationDelay = k * 70 + 'ms';
      slot.classList.add('in');
      k += 1;
    });
    return k;
  }

  /**
   * 稀有卡放大演出：
   * 先把卡片按「结果格」的尺寸与位置渲染在遮罩层里，
   * 再用 transform 放大并移到屏幕中央；随后把 transform 归零，
   * 卡片就会平滑缩回结果格，落点与真实格子完全重合。
   */
  function startSpotlight(index) {
    const slot = slotAt(index);
    if (!slot) {
      revealAll();
      completeReveal();
      return;
    }
    const rarity = pull.results[index].rarity;
    const t = TIMING[rarity] || TIMING[4];
    // 以卡片自身（而不是格子）的矩形为目标：格子在网格里会被拉伸，
    // 用它会导致落地时高度差几个像素。
    const target = (slot.querySelector('.rcard') || slot).getBoundingClientRect();
    if (window.Sound) window.Sound.play('fly');

    // 放大倍数同时受「期望宽度」和「视口剩余空间」约束，避免超大卡被裁切
    const maxWidth = Math.min(t.big, window.innerWidth * 0.86);
    const maxHeight = window.innerHeight * (t.maxHeightRatio || 0.86);
    let scale = Math.min(t.big / target.width, maxWidth / target.width, maxHeight / target.height);
    scale = Math.max(1.05, Math.min(3.2, scale));
    const offsetX = window.innerWidth / 2 - (target.left + target.width / 2);
    const offsetY = window.innerHeight / 2 - (target.top + target.height / 2);

    const layer = document.createElement('div');
    layer.className = 'spotlight-layer r' + rarity;
    const pop = document.createElement('div');
    pop.className = 'hero-pop';
    pop.style.width = target.width + 'px';
    pop.style.left = target.left + 'px';
    pop.style.top = target.top + 'px';
    pop.style.transform = 'translate(' + offsetX.toFixed(1) + 'px,' + offsetY.toFixed(1) + 'px) scale(' + scale.toFixed(4) + ')';

    const hero = slot.querySelector('.rcard').cloneNode(true);
    hero.classList.add('rcard-hero');
    pop.appendChild(hero);
    layer.appendChild(pop);
    $('pullOverlay').appendChild(layer);

    pull.phase = 'spotlight';
    pull.spotIndex = index;
    pull.layer = layer;
    pull.pop = pop;
    pull.timers.push(setTimeout(flyToSlot, pull.opts.fast ? 60 : t.hold));
  }

  function flyToSlot() {
    if (pull.phase !== 'spotlight') return;
    if (!pull.pop) {
      finishSpotlight();
      return;
    }
    const rarity = pull.results[pull.spotIndex].rarity;
    const t = TIMING[rarity] || TIMING[4];
    pull.phase = 'flying';
    pull.pop.style.transition = 'transform ' + t.fly + 'ms cubic-bezier(0.22, 0.85, 0.24, 1)';
    pull.pop.style.transform = 'translate(0px, 0px) scale(1)';
    pull.timers.push(setTimeout(finishSpotlight, t.fly + 30));
  }

  function finishSpotlight() {
    if (pull.phase !== 'spotlight' && pull.phase !== 'flying') return;
    clearPullTimers();
    if (window.Sound) window.Sound.play('land');
    if (pull.layer) {
      pull.layer.remove();
      pull.layer = null;
      pull.pop = null;
    }
    const slot = slotAt(pull.spotIndex);
    if (slot) {
      slot.classList.remove('pending');
      slot.classList.add('landed');
    }
    pull.phase = 'reveal';
    const rest = revealRest(pull.spotIndex);
    pull.timers.push(setTimeout(completeReveal, 180 + rest * 70));
  }

  function completeReveal() {
    clearPullTimers();
    pull.phase = 'done';
    const stage = $('pullStage');
    if (!stage.querySelector('.result-tip')) {
      const tip = document.createElement('div');
      tip.className = 'result-tip';
      tip.textContent = (pull.results.length > 1 ? '十连结果' : '单抽结果') + ' · 点击继续';
      stage.appendChild(tip);
    }
    $('pullSkip').hidden = true;
    $('pullContinue').hidden = false;
  }

  /** 跳过：分阶段推进，而不是一步到底，避免动画中间出现跳变 */
  function skipCurrent() {
    if (pull.phase === 'burst') {
      toReveal();
    } else if (pull.phase === 'spotlight' || pull.phase === 'flying') {
      finishSpotlight();
    } else if (pull.phase === 'reveal') {
      completeReveal();
    }
  }

  function endPull() {
    clearPullTimers();
    if (pull.layer) {
      pull.layer.remove();
      pull.layer = null;
      pull.pop = null;
    }
    pull.phase = 'idle';
    $('pullOverlay').hidden = true;
    $('pullOverlay').className = 'overlay';
    document.body.classList.remove('no-scroll');
    if (pull.resolve) {
      const fn = pull.resolve;
      pull.resolve = null;
      fn();
    }
  }

  function isPullOpen() {
    return !$('pullOverlay').hidden;
  }

  function toast(message, tone) {
    const el = $('toast');
    el.textContent = message;
    el.className = 'toast show ' + (tone || '');
    el.hidden = false;
    clearTimeout(el._timer);
    el._timer = setTimeout(function () {
      el.className = 'toast';
      el.hidden = true;
    }, 2200);
  }

  return {
    $: $,
    fmt: fmt,
    pct: pct,
    esc: esc,
    portrait: portrait,
    renderAll: renderAll,
    renderTopbar: renderTopbar,
    renderPity: renderPity,
    openModal: openModal,
    closeModal: closeModal,
    isModalOpen: isModalOpen,
    statsHTML: statsHTML,
    bookHTML: bookHTML,
    achievementsHTML: achievementsHTML,
    shopHTML: shopHTML,
    settingsHTML: settingsHTML,
    confirmHTML: confirmHTML,
    playPull: playPull,
    endPull: endPull,
    isPullOpen: isPullOpen,
    toast: toast,
  };
})();
