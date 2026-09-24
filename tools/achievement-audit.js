/**
 * 成就可达性审计
 *
 * 用真实引擎跑大批量抽卡，然后调用真实的 Achievements.metrics / progress，
 * 检查每条「引擎驱动」的成就能否在模拟里真的达成，防止再出现
 * 「第 90 抽硬保底」这种因为软保底太陡而永远触发不到的成就。
 *
 * 用法： node tools/achievement-audit.js [抽数]
 */
const path = require('path');

global.window = global;
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

require(path.join(__dirname, '..', 'js', 'data.js'));
require(path.join(__dirname, '..', 'js', 'gacha.js'));
require(path.join(__dirname, '..', 'js', 'state.js'));
require(path.join(__dirname, '..', 'js', 'achievements.js'));

const D = window.GameData;
const G = window.Gacha;
const S = window.SaveState;
const A = window.Achievements;

const PULLS = Number(process.argv[2] || 1000000);
const POOL_ID = 'limited_char';

// 这些指标靠玩家行为推进，模拟器里跑不出来，不作为可达性判据
const PLAYER_DRIVEN = ['workCount', 'spendCurrency', 'topupTotal', 'monthlyActive', 'currencyLt160', 'nightPulls'];
// 需要真实时间跨度的指标
const TIME_DRIVEN = ['maxDayPulls'];

function pad(str, n) {
  const s = String(str);
  const len = s.replace(/[^\x00-\xff]/g, '00').length;
  return s + ' '.repeat(Math.max(0, n - len));
}

function run() {
  const state = S.fresh();
  const pool = D.poolById(POOL_ID);
  const ps = state.pools[POOL_ID];
  const batches = Math.floor(PULLS / 10);

  for (let b = 0; b < batches; b++) {
    const results = G.pullMany(pool, ps, 10, state.stats);
    results.forEach(function (r) {
      S.own(state, r.item.id);
    });
    const fives = results.filter(function (r) {
      return r.rarity === 5;
    }).length;
    if (fives > state.stats.maxFiveInTen) state.stats.maxFiveInTen = fives;
  }

  // 把抽卡消耗也计入统计，避免金额类成就被误判
  state.spendCurrency = ps.total * D.CONFIG.pullCost.single;

  const m = A.metrics(state);
  const unlocked = A.check(state);

  const rows = [];
  let problems = 0;

  D.ACHIEVEMENTS.forEach(function (ach) {
    const p = A.progress(ach, m);
    const isPlayer = PLAYER_DRIVEN.indexOf(ach.metric) >= 0;
    const isTime = TIME_DRIVEN.indexOf(ach.metric) >= 0;
    let verdict;
    if (p.done) {
      verdict = '可达';
    } else if (isPlayer) {
      verdict = '玩家驱动';
    } else if (isTime) {
      verdict = '时间驱动';
    } else {
      verdict = '未命中';
      problems += 1;
    }
    rows.push({
      name: ach.name,
      metric: ach.metric,
      value: m[ach.metric],
      target: ach.target,
      verdict: verdict,
    });
  });

  console.log('=== 成就可达性审计（' + POOL_ID + '，' + PULLS.toLocaleString() + ' 抽 / ' + batches.toLocaleString() + ' 次十连）===');
  console.log('模拟中已达成 ' + unlocked.length + ' / ' + D.ACHIEVEMENTS.length + ' 项\n');

  rows.forEach(function (r) {
    const mark = r.verdict === '可达' ? '[可达]  ' : r.verdict === '未命中' ? '[未命中]' : '[跳过]  ';
    console.log(mark + ' ' + pad(r.name, 22) + pad(r.metric, 16) + pad(r.value + ' / ' + r.target, 14) + r.verdict);
  });

  console.log('\n=== 引擎关键指标 ===');
  console.log('十连最多出五星: ' + m.maxFiveInTen + ' 个（双黄蛋需 2 个，三黄蛋需 3 个）');
  console.log('最欧出金抽数: ' + (m.bestPity || '--') + ' 抽（目标 30 抽内 / 5 抽内）');
  console.log('80 抽之后才出金的次数: ' + m.latePityCount);
  console.log('累计歪掉次数: ' + m.lostFifties + '，最长连续歪: ' + m.maxLoseStreak + '（大保底机制下令其上限为 1）');

  if (problems) {
    console.log('\n有 ' + problems + ' 项引擎驱动成就未命中，需要确认是否可达。');
  } else {
    console.log('\n所有引擎驱动的成就均可达成。');
  }
  process.exit(problems ? 1 : 0);
}

run();
