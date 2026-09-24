/** 隐藏福利校验：触发间隔是否落在设定区间、权重是否生效、每一条都能被抽到 */
const path = require('path');

global.window = global;
global.document = { hidden: false };

const realSetTimeout = global.setTimeout;
const realClearTimeout = global.clearTimeout;
let pending = [];

// 用假定时器接管调度，直接读取下一次触发的间隔
global.setTimeout = function (fn, delay) {
  pending.push({ fn: fn, delay: delay });
  return pending.length;
};
global.clearTimeout = function () {};

require(path.join(__dirname, '..', 'js', 'data.js'));
require(path.join(__dirname, '..', 'js', 'bonus.js'));

const D = window.GameData;
const granted = [];
let busy = false;

window.Bonus.start(
  function (bonus) {
    granted.push(bonus);
  },
  function () {
    return busy;
  }
);

const results = [];
let failed = 0;

function check(name, pass, detail) {
  if (!pass) failed += 1;
  results.push((pass ? '  [通过] ' : '  [失败] ') + name + (detail ? ' — ' + detail : ''));
}

check('启动后已排定下一次福利', pending.length === 1, '待触发定时器 ' + pending.length + ' 个');
check(
  '首次间隔落在 120~300 秒',
  pending[0] && pending[0].delay >= 120000 && pending[0].delay <= 300000,
  pending[0] ? Math.round(pending[0].delay / 1000) + ' 秒' : '无'
);

// 跑 400 次触发，检查间隔与分布
const gaps = [];
for (let i = 0; i < 400; i++) {
  const timer = pending.pop();
  if (!timer) break;
  gaps.push(timer.delay);
  timer.fn();
}
const inRange = gaps.every(function (g) {
  return g >= 120000 && g <= 300000;
});
const avgGap = gaps.reduce(function (a, b) {
  return a + b;
}, 0) / gaps.length;
check('400 次触发的间隔全部在 120~300 秒之间', inRange);
check('平均间隔约 3.5 分钟', Math.abs(avgGap - 210000) < 25000, Math.round(avgGap / 1000) + ' 秒');

const ids = {};
granted.forEach(function (b) {
  ids[b.id] = (ids[b.id] || 0) + 1;
});
const missing = D.BONUSES.filter(function (b) {
  return !ids[b.id];
}).map(function (b) {
  return b.title;
});
check('400 次里每条福利都出现过', missing.length === 0, missing.length ? '没出现: ' + missing.join('、') : D.BONUSES.length + ' 条全覆盖');

const common = ids.boss_666 || 0;
const jackpot = ids.cat_payroll || 0;
check('高频条目明显多于稀有条目', common > jackpot, '老板发了 666：' + common + ' 次 / 猫踩发薪键：' + jackpot + ' 次');

const amounts = D.BONUSES.map(function (b) {
  return b.amount;
});
const minA = Math.min.apply(null, amounts);
const maxA = Math.max.apply(null, amounts);
check('金额跨度足够无厘头', minA === 1 && maxA >= 6000, '¥' + minA + ' ~ ¥' + maxA);

// 抽卡/弹层打开时应当让路
pending = [];
busy = true;
window.Bonus.stop();
window.Bonus.start(function () {}, function () {
  return true;
});
const deferTimer = pending.pop();
deferTimer.fn();
const afterDefer = pending.pop();
check(
  '忙碌时推迟到 20~45 秒后重试',
  afterDefer && afterDefer.delay >= 20000 && afterDefer.delay <= 45000,
  afterDefer ? Math.round(afterDefer.delay / 1000) + ' 秒' : '无'
);

global.setTimeout = realSetTimeout;
global.clearTimeout = realClearTimeout;

console.log('=== 隐藏福利校验 ===');
console.log(results.join('\n'));
console.log('\n福利条目共 ' + D.BONUSES.length + ' 条，金额 ¥' + minA + ' ~ ¥' + maxA);
console.log('抽到的金额合计 ¥' + granted.reduce(function (n, b) {
  return n + b.amount;
}, 0).toLocaleString());
console.log(failed === 0 ? '全部校验通过。' : '存在 ' + failed + ' 项未通过。');
process.exit(failed === 0 ? 0 : 1);
