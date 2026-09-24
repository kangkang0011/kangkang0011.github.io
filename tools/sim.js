/**
 * 概率压测：用 node 直接跑引擎，验证保底与概率是否符合设计。
 * 用法： node tools/sim.js [抽数]
 */
const path = require('path');

global.window = global;
require(path.join(__dirname, '..', 'js', 'data.js'));
require(path.join(__dirname, '..', 'js', 'gacha.js'));

const D = global.GameData;
const G = global.Gacha;

const RUNS = Number(process.argv[2] || 1000000);

function freshPoolState() {
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

function run(poolId, runs) {
  const pool = D.poolById(poolId);
  const s = freshPoolState();
  const pityHistogram = {};
  const fiveRarities = [];
  let maxPity = 0;
  let guaranteeViolations = 0;
  let pendingGuarantee = false;

  for (let i = 0; i < runs; i++) {
    const r = G.pull(pool, s);
    if (r.rarity === 5) {
      pityHistogram[r.pityAt] = (pityHistogram[r.pityAt] || 0) + 1;
      maxPity = Math.max(maxPity, r.pityAt);
      fiveRarities.push(r.isUp);
      if (pendingGuarantee && !r.isUp) guaranteeViolations++;
      pendingGuarantee = !r.isUp;
    }
  }

  const stats = G.summarize({ [poolId]: s });
  const upFive = fiveRarities.filter(Boolean).length;
  return {
    pool: pool,
    total: s.total,
    five: s.count5,
    four: s.count4,
    rate5: s.count5 / s.total,
    rate4: s.count4 / s.total,
    rate3: (s.total - s.count5 - s.count4) / s.total,
    avgPullsPer5: s.count5 ? s.total / s.count5 : 0,
    maxPity: maxPity,
    upShare: s.count5 ? upFive / s.count5 : 0,
    guaranteeViolations: guaranteeViolations,
    pityHistogram: pityHistogram,
    summarizeRate5: stats.rate5,
  };
}

function pct(n) {
  return (n * 100).toFixed(3) + '%';
}

function report(title, res) {
  console.log('\n=== ' + title + '（' + res.total.toLocaleString() + ' 抽）===');
  console.log('五星：' + res.five.toLocaleString() + '  综合概率 ' + pct(res.rate5) + '  平均 ' + res.avgPullsPer5.toFixed(2) + ' 抽/个');
  console.log('四星：' + res.four.toLocaleString() + '  综合概率 ' + pct(res.rate4));
  console.log('三星：综合概率 ' + pct(res.rate3));
  console.log('五星最大抽数（硬保底）：' + res.maxPity);
  if (res.pool.up5.length) {
    console.log('UP 占比：' + pct(res.upShare) + '（理论 66.7%）');
    console.log('大保底违约次数：' + res.guaranteeViolations);
  }
  const keys = Object.keys(res.pityHistogram)
    .map(Number)
    .sort((a, b) => a - b);
  const tail = keys.filter((k) => k >= 70).map((k) => k + '抽:' + res.pityHistogram[k]);
  console.log('70 抽之后的出金分布：' + tail.join('  '));
}

function check(name, pass, detail) {
  console.log((pass ? '  [通过] ' : '  [失败] ') + name + (detail ? ' — ' + detail : ''));
  return pass;
}

const limited = run('limited_char', RUNS);
const standard = run('standard_char', Math.round(RUNS / 4));
report('限定祈愿', limited);
report('常驻祈愿', standard);

console.log('\n=== 校验 ===');
const results = [];
results.push(check('限定池综合出金率在 1.4% ~ 1.8% 之间', limited.rate5 > 0.014 && limited.rate5 < 0.018, pct(limited.rate5)));
results.push(check('限定池出紫率在 12% ~ 14% 之间', limited.rate4 > 0.12 && limited.rate4 < 0.14, pct(limited.rate4)));
results.push(check('从未超过 90 抽硬保底', limited.maxPity <= 90, '最大 ' + limited.maxPity + ' 抽'));
results.push(check('大保底必定生效', limited.guaranteeViolations === 0, '违约 ' + limited.guaranteeViolations + ' 次'));
results.push(check('UP 占比接近 2/3', Math.abs(limited.upShare - 0.6667) < 0.02, pct(limited.upShare)));
results.push(check('常驻池不产出限定角色', standard.upShare === 0));

const allPass = results.every(Boolean);
console.log(allPass ? '\n全部校验通过。' : '\n存在未通过项。');
process.exit(allPass ? 0 : 1);
