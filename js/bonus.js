/** 隐藏福利调度：随机间隔触发一次意外之财，抽卡演出或弹层打开时会让路 */
window.Bonus = (function () {
  'use strict';

  const D = window.GameData;
  // 两次福利之间的间隔（毫秒）：默认 2~5 分钟一次，避免刷屏
  const MIN_GAP = 120000;
  const MAX_GAP = 300000;
  // 需要让路时的重试间隔
  const DEFER_MIN = 20000;
  const DEFER_MAX = 45000;

  let timer = null;
  let grant = null;
  let busyCheck = null;
  let fired = 0;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pickWeighted() {
    const list = D.BONUSES;
    let total = 0;
    list.forEach(function (b) {
      total += b.weight || 1;
    });
    let roll = Math.random() * total;
    for (let i = 0; i < list.length; i++) {
      roll -= list[i].weight || 1;
      if (roll <= 0) return list[i];
    }
    return list[list.length - 1];
  }

  function schedule(delay) {
    clearTimeout(timer);
    timer = setTimeout(fire, delay === undefined ? rand(MIN_GAP, MAX_GAP) : delay);
  }

  function fire() {
    if (document.hidden || (busyCheck && busyCheck())) {
      schedule(rand(DEFER_MIN, DEFER_MAX));
      return;
    }
    const bonus = pickWeighted();
    fired += 1;
    if (grant) grant(bonus);
    schedule();
  }

  /**
   * 启动福利调度
   * @param {function} handler 收到福利时调用，负责加钱与提示
   * @param {function} [isBusy] 返回 true 时推迟本次福利
   */
  function start(handler, isBusy) {
    grant = handler;
    busyCheck = isBusy || null;
    schedule();
  }

  function stop() {
    clearTimeout(timer);
    timer = null;
  }

  /** 调试用：立刻触发一次 */
  function triggerNow() {
    const bonus = pickWeighted();
    if (grant) grant(bonus);
    return bonus;
  }

  return {
    start: start,
    stop: stop,
    triggerNow: triggerNow,
    count: function () {
      return fired;
    },
  };
})();
