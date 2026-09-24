/**
 * 交互装配
 */
(function () {
  'use strict';

  const D = window.GameData;
  const C = D.CONFIG;
  const G = window.Gacha;
  const S = window.SaveState;
  const UI = window.UI;
  const A = window.Achievements;

  let state = S.load();
  let busy = false;
  let modalReturn = null;
  let toastQueue = [];
  let toastTimer = null;

  /** 提示排队：抽卡与成就可能同时达成，避免后一条把前一条覆盖掉 */
  function say(message, tone) {
    toastQueue.push({ message: message, tone: tone || '' });
    pumpToasts();
  }

  function pumpToasts() {
    if (toastTimer || !toastQueue.length) return;
    const item = toastQueue.shift();
    UI.toast(item.message, item.tone);
    toastTimer = setTimeout(function () {
      toastTimer = null;
      pumpToasts();
    }, 2400);
  }

  function notifyAch(list) {
    if (!list.length) return;
    // 一次解锁很多项时（例如老存档首次进入），合并成一条提示
    if (list.length > 2) {
      const total = list.reduce(function (n, a) {
        return n + a.reward;
      }, 0);
      say('达成 ' + list.length + ' 项成就（+' + UI.fmt(total) + ' 工资），点 🏆 查看', 'gold');
      return;
    }
    list.forEach(function (a) {
      say('成就达成：' + a.name + '（+' + UI.fmt(a.reward) + ' 工资）', 'gold');
    });
  }

  function persist() {
    S.save(state);
  }

  function refresh() {
    UI.renderAll(state);
  }

  function activePool() {
    return D.poolById(state.activePool);
  }

  /* ---------------- 抽卡 ---------------- */

  function doPull(times) {
    if (busy || UI.isPullOpen()) return;
    const pool = activePool();
    const cost = times === 1 ? C.pullCost.single : C.pullCost.ten;
    if (state.currency < cost) {
      say('工资不够了：点「上个班」白嫖，或者去「充值」', 'warn');
      return;
    }

    S.spend(state, cost);
    const results = G.pullMany(pool, state.pools[pool.id], times, state.stats);
    results.forEach(function (r) {
      r.isNew = S.own(state, r.item.id);
    });
    if (times === 10) state.stats.tenPulls += 1;
    if (times === 1) state.stats.singlePulls += 1;
    const fivesInBatch = results.filter(function (r) {
      return r.rarity === 5;
    }).length;
    if (fivesInBatch > state.stats.maxFiveInTen) state.stats.maxFiveInTen = fivesInBatch;
    const unlocked = A.check(state);
    persist();
    refresh();

    busy = true;
    UI.playPull(results, { fast: state.skipAnim }).then(function () {
      busy = false;
      refresh();
      const fives = results.filter(function (r) {
        return r.rarity === 5;
      });
      if (fives.length) {
        say(
          '获得五星：' + fives.map(function (f) {
            return f.item.name + (f.isUp ? '（UP）' : '');
          }).join('、'),
          'gold'
        );
      }
      notifyAch(unlocked);
    });
  }

  /* ---------------- 弹层 ---------------- */

  function openShop() {
    modalReturn = null;
    UI.openModal('充值中心', UI.shopHTML(state));
  }

  function openStats() {
    modalReturn = null;
    UI.openModal('数据统计', UI.statsHTML(state));
  }

  function openBook() {
    modalReturn = null;
    UI.openModal('打工人图鉴', UI.bookHTML(state));
  }

  function openSettings() {
    modalReturn = null;
    UI.openModal('设置', UI.settingsHTML(state));
  }

  function openAchievements() {
    modalReturn = null;
    UI.openModal('成就', UI.achievementsHTML(state));
  }

  function handleShopClick(target) {
    const tierBtn = target.closest('[data-tier]');
    if (tierBtn) {
      const tier = D.SHOP.tiers.filter(function (t) {
        return t.id === tierBtn.getAttribute('data-tier');
      })[0];
      if (!tier) return;
      const first = !state.topup.firstUsed[tier.id];
      const gained = tier.base + (first ? tier.base : 0);
      UI.openModal(
        '确认模拟支付',
        UI.confirmHTML(
          '¥' + tier.price + ' · ' + gained + ' 工资',
          [
            '获得 <b>' + gained + '</b> 工资' + (first ? '（含首充双倍）' : ''),
            '折合 <b>' + Math.floor(gained / C.pullCost.single) + '</b> 次抽卡',
            '<span class="muted">这是模拟支付，不会产生真实扣款。</span>',
          ],
          '确认支付',
          'data-confirm="tier" data-id="' + tier.id + '"'
        )
      );
      modalReturn = openShop;
      return true;
    }

    const monthlyBtn = target.closest('[data-monthly]');
    if (monthlyBtn) {
      const card = D.SHOP.monthly;
      UI.openModal(
        '确认模拟支付',
        UI.confirmHTML(
          card.name + ' · ¥' + card.price,
          [
            '立即获得 <b>' + card.immediate + '</b> 工资',
            '此后 ' + card.days + ' 天，每天首次进入可领取 <b>' + card.daily + '</b> 工资',
            '<span class="muted">模拟支付，不会产生真实扣款。</span>',
          ],
          '确认支付',
          'data-confirm="monthly"'
        )
      );
      modalReturn = openShop;
      return true;
    }

    const confirmBtn = target.closest('[data-confirm]');
    if (confirmBtn) {
      const kind = confirmBtn.getAttribute('data-confirm');
      if (kind === 'tier') {
        const tier = D.SHOP.tiers.filter(function (t) {
          return t.id === confirmBtn.getAttribute('data-id');
        })[0];
        const res = S.buyTier(state, tier);
        const unlocked = A.check(state);
        persist();
        refresh();
        openShop();
        say('充值成功 +' + UI.fmt(res.gained) + ' 工资' + (res.first ? '（首充双倍）' : ''), 'gold');
        notifyAch(unlocked);
      } else if (kind === 'monthly') {
        const gained = S.buyMonthly(state);
        const unlocked = A.check(state);
        persist();
        refresh();
        openShop();
        say('月卡开通成功 +' + UI.fmt(gained) + ' 工资', 'gold');
        notifyAch(unlocked);
      } else if (kind === 'reset') {
        state = S.reset();
        persist();
        refresh();
        UI.closeModal();
        say('存档已重置', 'warn');
      }
      return true;
    }
    return false;
  }

  function handleSettingsClick(target) {
    const toggle = target.closest('[data-toggle]');
    if (toggle) {
      state.skipAnim = !state.skipAnim;
      persist();
      openSettings();
      return true;
    }

    const action = target.closest('[data-action]');
    if (action) {
      const kind = action.getAttribute('data-action');
      if (kind === 'export') {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'buxiangshangban-save.json';
        a.click();
        URL.revokeObjectURL(url);
        say('存档已导出');
      } else if (kind === 'reset') {
        UI.openModal(
          '确认重置',
          UI.confirmHTML(
            '重置后无法恢复',
            ['将清空抽卡记录、图鉴进度、余额与充值记录。', '<span class="muted">建议先导出存档。</span>'],
            '确认重置',
            'data-confirm="reset"'
          )
        );
        modalReturn = openSettings;
      }
      return true;
    }
    return false;
  }

  function handleImport(file) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        state = S.migrate(JSON.parse(String(reader.result)));
        persist();
        refresh();
        UI.closeModal();
        say('存档导入成功');
      } catch (err) {
        say('存档文件无法解析', 'warn');
      }
    };
    reader.readAsText(file);
  }

  /* ---------------- 事件绑定 ---------------- */

  function bind() {
    UI.$('btnPull1').addEventListener('click', function () {
      doPull(1);
    });
    UI.$('btnPull10').addEventListener('click', function () {
      doPull(10);
    });

    UI.$('btnWork').addEventListener('click', function () {
      state.currency += C.workReward;
      state.workCount += 1;
      const unlocked = A.check(state);
      persist();
      refresh();
      say('上班 30 秒，到账 ' + UI.fmt(C.workReward) + ' 工资');
      notifyAch(unlocked);
    });

    UI.$('btnShop').addEventListener('click', openShop);
    UI.$('btnAch').addEventListener('click', openAchievements);
    UI.$('btnStats').addEventListener('click', openStats);
    UI.$('btnBook').addEventListener('click', openBook);
    UI.$('btnSettings').addEventListener('click', openSettings);

    UI.$('poolTabs').addEventListener('click', function (ev) {
      const tab = ev.target.closest('[data-pool]');
      if (!tab) return;
      state.activePool = tab.getAttribute('data-pool');
      persist();
      refresh();
    });

    UI.$('modalClose').addEventListener('click', UI.closeModal);
    UI.$('modal').addEventListener('click', function (ev) {
      if (ev.target === UI.$('modal')) {
        UI.closeModal();
        return;
      }
      const target = ev.target;
      if (target.closest('[data-action="cancel"]')) {
        if (modalReturn) {
          const back = modalReturn;
          modalReturn = null;
          back();
        } else {
          UI.closeModal();
        }
        return;
      }
      if (handleShopClick(target)) return;
      handleSettingsClick(target);
    });

    UI.$('modal').addEventListener('change', function (ev) {
      if (ev.target && ev.target.id === 'importFile' && ev.target.files[0]) {
        handleImport(ev.target.files[0]);
      }
    });

    UI.$('pullOverlay').addEventListener('click', function (ev) {
      if (ev.target.closest('#pullSkip')) return;
      if (UI.$('pullContinue').hidden) return;
      UI.endPull();
    });
    UI.$('pullContinue').addEventListener('click', function (ev) {
      ev.stopPropagation();
      UI.endPull();
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        if (UI.isPullOpen()) UI.endPull();
        else if (UI.isModalOpen()) UI.closeModal();
      }
      if (ev.key === ' ' && !UI.isModalOpen()) {
        if (UI.isPullOpen()) {
          ev.preventDefault();
          UI.endPull();
        }
      }
    });
  }

  function init() {
    const gained = S.claimMonthly(state);
    bind();
    const unlocked = A.check(state);
    refresh();
    persist();
    if (gained) say('月卡每日工资 +' + UI.fmt(gained), 'gold');
    notifyAch(unlocked);
    if (state.topup.monthly.active && !gained) {
      /* 今天已经领过，静默 */
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
