/**
 * 《不想上班》抽卡引擎
 * 纯逻辑，不依赖 DOM，可用 node 直接压测（见 tools/sim.js）
 */
window.Gacha = (function () {
  'use strict';

  const D = window.GameData;

  const CODE_PREFIX = ['摸鱼', '加班', '汇报', '续命', '准点', '内卷', '咖啡', '周报', '带薪', '隔间'];

  function randomOf(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /** 每位打工人都有稳定的工号与代号，由 id 推导，保证图鉴里前后一致 */
  function employee(itemId) {
    const h = hashString(itemId);
    const code = 'W-' + String(h % 9000 + 1000);
    const alias = CODE_PREFIX[h % CODE_PREFIX.length] + '-' + String(Math.floor(h / 7) % 9000 + 1000);
    return { code: code, alias: alias };
  }

  /** 单抽的五星概率：基础概率 + 软保底递增 + 硬保底 */
  function fiveChance(pool, pullsSinceFive) {
    const cfg = pool.five;
    if (pullsSinceFive >= cfg.hardPity) return 1;
    if (pullsSinceFive > cfg.softStart) {
      return Math.min(1, cfg.base + (pullsSinceFive - cfg.softStart) * cfg.softStep);
    }
    return cfg.base;
  }

  function resolveFive(pool, s) {
    if (pool.up5.length) {
      if (s.guaranteed5) {
        return { item: D.itemById(randomOf(pool.up5)), isUp: true, nextGuaranteed: false };
      }
      if (Math.random() < 0.5) {
        return { item: D.itemById(randomOf(pool.up5)), isUp: true, nextGuaranteed: false };
      }
      return { item: D.itemById(randomOf(pool.standard5)), isUp: false, nextGuaranteed: true };
    }
    return { item: D.itemById(randomOf(pool.standard5)), isUp: false, nextGuaranteed: false };
  }

  function resolveFour(pool, s) {
    if (pool.up4.length) {
      if (s.guaranteed4) {
        return { item: D.itemById(randomOf(pool.up4)), isUp: true, nextGuaranteed: false };
      }
      if (Math.random() < 0.5) {
        return { item: D.itemById(randomOf(pool.up4)), isUp: true, nextGuaranteed: false };
      }
      return { item: D.itemById(randomOf(pool.standard4)), isUp: false, nextGuaranteed: true };
    }
    return { item: D.itemById(randomOf(pool.standard4)), isUp: false, nextGuaranteed: false };
  }

  /**
   * 抽一次。会直接修改 state（该卡池的保底计数与总计数），并返回结果。
   * @param {object} pool 卡池配置
   * @param {object} s   该卡池的存档状态
   * @param {object} [stats] 成就统计（可选），用于记录最佳保底、歪卡连击等
   * @returns {{rarity:number,item:object,isUp:boolean,pityAt:number}}
   */
  function pull(pool, s, stats) {
    const pullsSinceFive = s.pity5 + 1;
    const pullsSinceFour = s.pity4 + 1;
    const isFive = Math.random() < fiveChance(pool, pullsSinceFive);

    let result;
    if (isFive) {
      const five = resolveFive(pool, s);
      s.pity5 = 0;
      s.pity4 = 0;
      s.guaranteed5 = five.nextGuaranteed;
      result = { rarity: 5, item: five.item, isUp: five.isUp, pityAt: pullsSinceFive };
    } else {
      const fourChance = pullsSinceFour >= pool.four.hardPity ? 1 : pool.four.base;
      if (Math.random() < fourChance) {
        const four = resolveFour(pool, s);
        s.pity5 = pullsSinceFive;
        s.pity4 = 0;
        s.guaranteed4 = four.nextGuaranteed;
        result = { rarity: 4, item: four.item, isUp: four.isUp, pityAt: pullsSinceFour };
      } else {
        s.pity5 = pullsSinceFive;
        s.pity4 = pullsSinceFour;
        result = { rarity: 3, item: D.itemById(randomOf(pool.three)), isUp: false, pityAt: 0 };
      }
    }

    s.total += 1;
    if (result.rarity === 5) {
      s.count5 += 1;
      if (result.isUp) s.count5Up = (s.count5Up || 0) + 1;
      if (stats) {
        const now = new Date();
        const hour = now.getHours();
        if (hour >= 0 && hour < 5) stats.nightPulls = (stats.nightPulls || 0) + 1;
        const day = now.toDateString();
        if (stats.todayDate !== day) {
          stats.todayDate = day;
          stats.todayPulls = 0;
        }
        stats.todayPulls = (stats.todayPulls || 0) + 1;
        if (stats.todayPulls > (stats.maxDayPulls || 0)) stats.maxDayPulls = stats.todayPulls;
        if (!stats.bestPity || result.pityAt < stats.bestPity) stats.bestPity = result.pityAt;
        // 硬保底实际几乎触发不到（软保底在第 89 抽已达 90% 以上），所以按「80 抽后出金」统计
        if (result.pityAt >= 80) stats.latePityCount = (stats.latePityCount || 0) + 1;
        if (result.isUp) {
          stats.loseStreak = 0;
          stats.upFiveCount = (stats.upFiveCount || 0) + 1;
        } else {
          stats.loseStreak = (stats.loseStreak || 0) + 1;
          stats.lostFifties = (stats.lostFifties || 0) + 1;
          if (stats.loseStreak > (stats.maxLoseStreak || 0)) {
            stats.maxLoseStreak = stats.loseStreak;
          }
        }
      }
    }
    if (result.rarity === 4) s.count4 += 1;

    const log = {
      rarity: result.rarity,
      id: result.item.id,
      name: result.item.name,
      element: result.item.element,
      isUp: result.isUp,
      n: s.total,
      ts: Date.now(),
    };
    s.history.unshift(log);
    if (s.history.length > 300) s.history.length = 300;

    return result;
  }

  function pullMany(pool, s, times, stats) {
    const out = [];
    for (let i = 0; i < times; i++) {
      const r = pull(pool, s, stats);
      r.index = i;
      out.push(r);
    }
    if (stats) {
      // 批次级统计放在引擎里，避免 UI 层漏记导致成就不可达
      if (times === 10) stats.tenPulls = (stats.tenPulls || 0) + 1;
      else if (times === 1) stats.singlePulls = (stats.singlePulls || 0) + 1;
      const fives = out.filter(function (r) {
        return r.rarity === 5;
      }).length;
      if (fives > (stats.maxFiveInTen || 0)) stats.maxFiveInTen = fives;
    }
    return out;
  }

  /** 汇总一个或多个卡池的统计信息 */
  function summarize(poolStates) {
    const acc = {
      total: 0,
      five: 0,
      four: 0,
      three: 0,
      upFive: 0,
      count5: 0,
      count4: 0,
      rate5: 0,
      rate4: 0,
      avgPullsPer5: 0,
      upRate: 0,
    };
    Object.keys(poolStates).forEach(function (id) {
      const p = poolStates[id];
      acc.total += p.total;
      acc.five += p.count5;
      acc.four += p.count4;
      acc.count5 += p.count5;
      acc.count4 += p.count4;
      acc.upFive += p.count5Up || 0;
    });
    acc.three = Math.max(0, acc.total - acc.five - acc.four);
    acc.rate5 = acc.total ? acc.five / acc.total : 0;
    acc.rate4 = acc.total ? acc.four / acc.total : 0;
    acc.avgPullsPer5 = acc.five ? acc.total / acc.five : 0;
    acc.upRate = acc.five ? acc.upFive / acc.five : 0;
    return acc;
  }

  return {
    pull: pull,
    pullMany: pullMany,
    employee: employee,
    fiveChance: fiveChance,
    summarize: summarize,
    hashString: hashString,
  };
})();
