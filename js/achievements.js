/**
 * 成就系统
 * 从存档里算出各项指标，和成就表比对；达成即解锁、发工资、累计成就点。
 */
window.Achievements = (function () {
  'use strict';

  const D = window.GameData;

  /** 汇总当前存档的成就指标 */
  function metrics(state) {
    const sum = window.Gacha.summarize(state.pools);
    const st = state.stats || {};
    const owned = Object.keys(state.owned || {})
      .map(function (id) {
        return D.itemById(id);
      })
      .filter(Boolean);

    const byRarity = function (r) {
      return owned.filter(function (i) {
        return i.rarity === r;
      }).length;
    };

    return {
      totalPulls: sum.total,
      singlePulls: st.singlePulls || 0,
      tenPulls: st.tenPulls || 0,
      fiveCount: sum.five,
      fourCount: sum.four,
      threeCount: Math.max(0, sum.total - sum.five - sum.four),
      upFiveCount: st.upFiveCount || 0,
      maxFiveInTen: st.maxFiveInTen || 0,
      bestPity: st.bestPity || 0,
      hardPityCount: st.hardPityCount || 0,
      maxLoseStreak: st.maxLoseStreak || 0,
      latePityCount: st.latePityCount || 0,
      lostFifties: st.lostFifties || 0,
      maxDayPulls: st.maxDayPulls || 0,
      nightPulls: st.nightPulls || 0,
      ownedKinds: owned.length,
      ownedFiveKinds: byRarity(5),
      ownedFourKinds: byRarity(4),
      ownedThreeKinds: byRarity(3),
      hasLimited: owned.filter(function (i) {
        return i.exclusive === 'limited';
      }).length,
      workCount: state.workCount || 0,
      spendCurrency: state.spendCurrency || 0,
      topupTotal: state.topup ? state.topup.total : 0,
      monthlyActive: state.topup && state.topup.monthly.active ? 1 : 0,
      currencyLt160: state.currency < D.CONFIG.pullCost.single ? 1 : 0,
    };
  }

  /** 单个成就的进度：done 为是否达成，ratio 用于进度条 */
  function progress(ach, m) {
    const value = typeof m[ach.metric] === 'number' ? m[ach.metric] : 0;
    if (ach.op === 'lte') {
      const done = value > 0 && value <= ach.target;
      const ratio = value === 0 ? 0 : Math.min(1, ach.target / value);
      return { value: value, target: ach.target, done: done, ratio: done ? 1 : ratio };
    }
    const done = value >= ach.target;
    return { value: value, target: ach.target, done: done, ratio: Math.min(1, value / ach.target) };
  }

  /**
   * 检查并解锁成就。会直接修改 state（解锁记录、成就点、工资）。
   * @returns {Array} 本次新解锁的成就
   */
  function check(state) {
    if (!state.ach) state.ach = { unlocked: {}, points: 0 };
    if (!state.ach.unlocked) state.ach.unlocked = {};
    const m = metrics(state);
    const newly = [];
    D.ACHIEVEMENTS.forEach(function (ach) {
      if (state.ach.unlocked[ach.id]) return;
      if (progress(ach, m).done) {
        state.ach.unlocked[ach.id] = Date.now();
        state.ach.points += ach.points;
        state.currency += ach.reward;
        newly.push(ach);
      }
    });
    return newly;
  }

  function summary(state) {
    const unlocked = (state.ach && state.ach.unlocked) || {};
    const count = D.ACHIEVEMENTS.filter(function (a) {
      return unlocked[a.id];
    }).length;
    return {
      count: count,
      total: D.ACHIEVEMENTS.length,
      points: (state.ach && state.ach.points) || 0,
      maxPoints: D.ACHIEVEMENTS.reduce(function (n, a) {
        return n + a.points;
      }, 0),
    };
  }

  return {
    metrics: metrics,
    progress: progress,
    check: check,
    summary: summary,
  };
})();
