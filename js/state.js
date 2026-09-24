/**
 * 存档与资源（localStorage）
 */
window.SaveState = (function () {
  'use strict';

  const CONFIG = window.GameData.CONFIG;
  const POOLS = window.GameData.POOLS;
  const KEY = CONFIG.storageKey;
  const DAY = 24 * 60 * 60 * 1000;

  function freshPool() {
    return {
      pity5: 0,
      pity4: 0,
      guaranteed5: false,
      guaranteed4: false,
      total: 0,
      count5: 0,
      count4: 0,
      count5Up: 0,
      history: [],
    };
  }

  function fresh() {
    const pools = {};
    POOLS.forEach(function (p) {
      pools[p.id] = freshPool();
    });
    return {
      version: 1,
      currency: CONFIG.startCurrency,
      activePool: POOLS[0].id,
      pools: pools,
      owned: {},
      workCount: 0,
      spendCurrency: 0,
      skipAnim: false,
      sound: true,
      stats: {
        singlePulls: 0,
        tenPulls: 0,
        maxFiveInTen: 0,
        bestPity: 0,
        hardPityCount: 0,
        loseStreak: 0,
        maxLoseStreak: 0,
        upFiveCount: 0,
      },
      ach: { unlocked: {}, points: 0 },
      topup: {
        total: 0,
        tiers: {},
        firstUsed: {},
        monthly: { active: false, expire: 0, lastClaim: 0 },
      },
    };
  }

  function migrate(raw) {
    const base = fresh();
    if (!raw || typeof raw !== 'object') return base;
    const merged = Object.assign(base, raw);
    merged.pools = Object.assign(base.pools, raw.pools || {});
    POOLS.forEach(function (p) {
      merged.pools[p.id] = Object.assign(freshPool(), merged.pools[p.id] || {});
    });
    merged.topup = Object.assign(base.topup, raw.topup || {});
    merged.topup.monthly = Object.assign(base.topup.monthly, (raw.topup && raw.topup.monthly) || {});
    merged.stats = Object.assign(base.stats, raw.stats || {});
    merged.ach = Object.assign(base.ach, raw.ach || {});
    merged.ach.unlocked = Object.assign({}, (raw.ach && raw.ach.unlocked) || {});
    if (typeof merged.currency !== 'number' || isNaN(merged.currency)) merged.currency = CONFIG.startCurrency;
    if (!merged.pools[merged.activePool]) merged.activePool = POOLS[0].id;
    return merged;
  }

  function load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return fresh();
      return migrate(JSON.parse(raw));
    } catch (err) {
      return fresh();
    }
  }

  function save(state) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      return false;
    }
  }

  function reset() {
    try {
      window.localStorage.removeItem(KEY);
    } catch (err) {
      /* 忽略：隐私模式下可能不可用 */
    }
    return fresh();
  }

  function addCurrency(state, amount) {
    state.currency += amount;
    return state.currency;
  }

  function spend(state, amount) {
    if (state.currency < amount) return false;
    state.currency -= amount;
    state.spendCurrency += amount;
    return true;
  }

  /** 记录一次抽卡获得，返回是否为第一次获得 */
  function own(state, itemId) {
    const isNew = !state.owned[itemId];
    state.owned[itemId] = (state.owned[itemId] || 0) + 1;
    return isNew;
  }

  function buyTier(state, tier) {
    const first = !state.topup.firstUsed[tier.id];
    const gained = tier.base + (first ? tier.base : 0);
    state.topup.firstUsed[tier.id] = true;
    state.topup.tiers[tier.id] = (state.topup.tiers[tier.id] || 0) + 1;
    state.topup.total += tier.price;
    state.currency += gained;
    return { gained: gained, first: first };
  }

  function buyMonthly(state) {
    const m = state.topup.monthly;
    const now = Date.now();
    state.topup.total += window.GameData.SHOP.monthly.price;
    state.currency += window.GameData.SHOP.monthly.immediate;
    m.active = true;
    m.expire = Math.max(m.expire || 0, now) + window.GameData.SHOP.monthly.days * DAY;
    m.lastClaim = now;
    return window.GameData.SHOP.monthly.immediate;
  }

  /** 月卡每日领取：离线多天可补发，最多到月卡到期日 */
  function claimMonthly(state) {
    const m = state.topup.monthly;
    const card = window.GameData.SHOP.monthly;
    const now = Date.now();
    if (!m.active || now > m.expire) return 0;
    const remainDays = Math.ceil((m.expire - now) / DAY);
    let days = m.lastClaim ? Math.floor((now - m.lastClaim) / DAY) : 1;
    days = Math.max(0, Math.min(days, remainDays));
    if (days <= 0) return 0;
    const gained = days * card.daily;
    state.currency += gained;
    m.lastClaim = m.lastClaim ? m.lastClaim + days * DAY : now;
    return gained;
  }

  function monthlyRemainDays(state) {
    const m = state.topup.monthly;
    if (!m.active || Date.now() > m.expire) return 0;
    return Math.ceil((m.expire - Date.now()) / DAY);
  }

  return {
    load: load,
    save: save,
    reset: reset,
    fresh: fresh,
    migrate: migrate,
    addCurrency: addCurrency,
    spend: spend,
    own: own,
    buyTier: buyTier,
    buyMonthly: buyMonthly,
    claimMonthly: claimMonthly,
    monthlyRemainDays: monthlyRemainDays,
  };
})();
