/**
 * 《不想上班》打工人抽卡模拟器 —— 数据层
 * 所有角色、装备、卡池、充值档位均为原创内容，与任何真实游戏无关。
 */
window.GameData = (function () {
  'use strict';

  const ELEMENTS = {
    coffee: { id: 'coffee', name: '咖啡', icon: '☕', color: '#c8873f', desc: '续航与提神' },
    slack: { id: 'slack', name: '摸鱼', icon: '🐟', color: '#39a08e', desc: '闪避与潜行' },
    overtime: { id: 'overtime', name: '加班', icon: '🌙', color: '#7a6ae0', desc: '爆发与持久' },
    report: { id: 'report', name: '汇报', icon: '📊', color: '#d4b25a', desc: '增益与控制' },
    ratrace: { id: 'ratrace', name: '内卷', icon: '🔥', color: '#cf5a45', desc: '输出与压制' },
  };

  // 五星：常驻打工人 + 本期限定
  const FIVE = [
    {
      id: 'five_moyu_godfather',
      name: '摸鱼教父',
      rarity: 5,
      element: 'slack',
      dept: '战略摸鱼部',
      skill: '带薪摸鱼',
      desc: '被动：每认真工作 1 小时，自动获得 10 分钟摸鱼额度，额度可累积。',
      quote: '上班的意义，就是为了下班。',
      exclusive: 'limited',
    },
    {
      id: 'five_reportgod',
      name: '周报之神',
      rarity: 5,
      element: 'report',
      dept: '汇报与留痕部',
      skill: '八页周报',
      desc: '把三小时的工作写成八页带配图的周报，全队气势 +200%。',
      quote: '过程要留痕，结果可以等。',
    },
    {
      id: 'five_coffeelich',
      name: '咖啡续命大师',
      rarity: 5,
      element: 'coffee',
      dept: '咖啡因工程部',
      skill: '第四杯觉醒',
      desc: '第四杯美式下肚后进入超频状态，暴击率翻倍，持续到下班。',
      quote: '我不是困，我只是需要燃料。',
    },
    {
      id: 'five_ontime',
      name: '准点下班者',
      rarity: 5,
      element: 'slack',
      dept: '摸鱼部',
      skill: '18:00 闪现',
      desc: '分针指向 12 的瞬间从工位消失，任何临时会议都无法命中。',
      quote: '下班不积极，思想有问题。',
    },
    {
      id: 'five_996',
      name: '996 战神',
      rarity: 5,
      element: 'overtime',
      dept: '加班事业部',
      skill: '灯还亮着',
      desc: '23:00 之后战斗力提升 200%，凌晨反而更精神。',
      quote: '我不是在加班，我是在成长。',
    },
    {
      id: 'five_meetingender',
      name: '会议终结者',
      rarity: 5,
      element: 'report',
      dept: '会议管理部',
      skill: '一句收尾',
      desc: '把已经跑题四十分钟的会议，在三分零七秒内结束。',
      quote: '这个议题我们线下再对齐。',
    },
    {
      id: 'five_ratking',
      name: '内卷之王',
      rarity: 5,
      element: 'ratrace',
      dept: '绩效考核部',
      skill: '再卷一点',
      desc: '队友越努力，自身攻击力越高，全公司加班时长 +1 小时。',
      quote: '你可以不优秀，但你不能比别人差。',
    },
  ];

  // 四星：正式员工
  const FOUR = [
    {
      id: 'four_nightsnack',
      name: '加班夜宵官',
      rarity: 4,
      element: 'overtime',
      dept: '后勤保障部',
      skill: '深夜加餐',
      desc: '为全队恢复 30 点体力，并附赠一罐冰可乐。',
      quote: '吃口东西，继续干。',
    },
    {
      id: 'four_lurker',
      name: '群聊潜水员',
      rarity: 4,
      element: 'slack',
      dept: '沉默是金部',
      skill: '已读不回',
      desc: '在 200 人的工作群里保持零发言，且从不被点名。',
      quote: '我看到了，我只是不说话。',
    },
    {
      id: 'four_pptmage',
      name: 'PPT 魔法师',
      rarity: 4,
      element: 'report',
      dept: '视觉包装部',
      skill: '三分钟一页',
      desc: '把一页填空内容做成发布会级别，动画多到没人看内容。',
      quote: '内容不够，动画来凑。',
    },
    {
      id: 'four_seathog',
      name: '会议室占座王',
      rarity: 4,
      element: 'ratrace',
      dept: '会议管理部',
      skill: '座位已占',
      desc: '提前十五分钟占下最靠里的位置，永远不会被推出去讲。',
      quote: '先到先得，这是规矩。',
    },
    {
      id: 'four_sofahunter',
      name: '午休抢沙发',
      rarity: 4,
      element: 'slack',
      dept: '午休事业部',
      skill: '十二点半冲刺',
      desc: '午休开始的十秒内占领沙发，速度无人能敌。',
      quote: '沙发只有一张，我先走了。',
    },
    {
      id: 'four_groupbuy',
      name: '外卖拼单团长',
      rarity: 4,
      element: 'coffee',
      dept: '餐饮统筹部',
      skill: '满减精算',
      desc: '把满减凑到小数点后两位，全组每人省下三块五。',
      quote: '再来一个人，就能减十五了。',
    },
    {
      id: 'four_polisher',
      name: '周报润色专家',
      rarity: 4,
      element: 'report',
      dept: '汇报与留痕部',
      skill: '措辞升级',
      desc: '把「还没做」改成「正在推进」，把「做错了」改成「已快速迭代」。',
      quote: '换个说法，就成了亮点。',
    },
    {
      id: 'four_caffeine',
      name: '咖啡因依赖者',
      rarity: 4,
      element: 'coffee',
      dept: '咖啡因工程部',
      skill: '续杯本能',
      desc: '一天五杯，手不抖，心跳很快，但活儿干完了。',
      quote: '再一杯，就一杯。',
    },
    {
      id: 'four_elevatoractor',
      name: '电梯里装忙',
      rarity: 4,
      element: 'ratrace',
      dept: '表演艺术部',
      skill: '低头看手机',
      desc: '与领导同乘电梯时，始终保持高效又忙碌的假象。',
      quote: '嗯，这个我回去看一下。',
    },
    {
      id: 'four_ninja',
      name: '厕所摸鱼侠',
      rarity: 4,
      element: 'slack',
      dept: '带薪休息部',
      skill: '十五分钟',
      desc: '每天在隔间里获得十五分钟完全自由的清醒时间。',
      quote: '这是我最清醒的十五分钟。',
    },
    {
      id: 'four_countdown',
      name: '年假倒计时',
      rarity: 4,
      element: 'overtime',
      dept: '假期规划部',
      skill: '还剩 87 天',
      desc: '每天早上刷新一次年假余额，靠这个数字活下去。',
      quote: '再撑撑，就要放假了。',
    },
    {
      id: 'four_plant',
      name: '工位小盆栽',
      rarity: 4,
      element: 'coffee',
      dept: '绿化养护部',
      skill: '光合作用',
      desc: '在显示器旁边安静生长，是办公室里唯一不焦虑的存在。',
      quote: '……（它没有台词，它只会慢慢枯萎）',
    },
  ];

  // 三星：办公用品
  const THREE = [
    { id: 'three_noodle', name: '一碗泡面', rarity: 3, element: 'overtime', desc: '深夜加班的标准配置，味道是安心的。' },
    { id: 'three_instant', name: '速溶咖啡条', rarity: 3, element: 'coffee', desc: '撕开就是希望，搅一搅就是活下去的理由。' },
    { id: 'three_mouse', name: '无线鼠标', rarity: 3, element: 'report', desc: '电池永远在述职当天没电。' },
    { id: 'three_keyboard', name: '静音机械键盘', rarity: 3, element: 'ratrace', desc: '敲起来很努力，听起来很专业。' },
    { id: 'three_pillow', name: '午睡颈枕', rarity: 3, element: 'slack', desc: '十五分钟的尊严，全靠它撑着。' },
    { id: 'three_badge', name: '工牌挂绳', rarity: 3, element: 'report', desc: '身份的象征，权限仅限园区内部。' },
    { id: 'three_headphone', name: '降噪耳机', rarity: 3, element: 'slack', desc: '戴上之后，整个世界与我无关。' },
    { id: 'three_snackbox', name: '办公室零食柜', rarity: 3, element: 'coffee', desc: '公共资源，手快有手慢无。' },
    { id: 'three_taxicoupon', name: '加班打车券', rarity: 3, element: 'overtime', desc: '22:00 之后自动生效，是一种补偿。' },
    { id: 'three_lumbar', name: '腰靠垫', rarity: 3, element: 'ratrace', desc: '久坐人士的救命稻草，救不了颈椎。' },
    { id: 'three_thermos', name: '保温杯', rarity: 3, element: 'coffee', desc: '枸杞与咖啡共存，中年与年轻和解。' },
    { id: 'three_powerstrip', name: '多功能插线板', rarity: 3, element: 'overtime', desc: '整层楼的命脉，插满之后永远少一个口。' },
  ];

  const STANDARD5 = FIVE.filter((c) => !c.exclusive).map((c) => c.id);
  const LIMITED5 = FIVE.filter((c) => c.exclusive === 'limited').map((c) => c.id);
  const FOUR_IDS = FOUR.map((c) => c.id);
  const THREE_IDS = THREE.map((c) => c.id);

  const POOLS = [
    {
      id: 'limited_char',
      tag: '限定祈愿',
      name: '摸鱼大师',
      sub: '本周限定 · 五星「摸鱼教父」概率 UP',
      theme: 'limited',
      up5: LIMITED5,
      up4: ['four_nightsnack', 'four_pptmage', 'four_ninja'],
      standard5: STANDARD5,
      standard4: FOUR_IDS,
      three: THREE_IDS,
      notes: [
        '五星基础概率 0.6%，第 74 抽起概率递增，第 90 抽必定获得五星',
        '获得五星时，有 50% 概率为限定角色；若不是，下次五星必定为限定角色',
        '四星基础概率 6%，每 10 抽内必定获得四星或以上（综合出紫率约 12.7%）',
      ],
      five: { base: 0.006, softStart: 74, softStep: 0.06, hardPity: 90 },
      four: { base: 0.06, hardPity: 10 },
    },
    {
      id: 'standard_char',
      tag: '常驻祈愿',
      name: '打工人生',
      sub: '常驻卡池 · 六位五星打工人常驻登场',
      theme: 'standard',
      up5: [],
      up4: [],
      standard5: STANDARD5,
      standard4: FOUR_IDS,
      three: THREE_IDS,
      notes: [
        '五星基础概率 0.6%，第 74 抽起概率递增，第 90 抽必定获得五星',
        '常驻祈愿不包含限定角色，也无法获得大保底',
        '四星基础概率 6%，每 10 抽内必定获得四星或以上（综合出紫率约 12.7%）',
      ],
      five: { base: 0.006, softStart: 74, softStep: 0.06, hardPity: 90 },
      four: { base: 0.06, hardPity: 10 },
    },
  ];

  // 充值档位（模拟，不涉及任何真实支付）
  const SHOP = {
    tiers: [
      { id: 'tier_6', price: 6, base: 60, tag: '' },
      { id: 'tier_30', price: 30, base: 300, tag: '' },
      { id: 'tier_98', price: 98, base: 980, tag: '热门' },
      { id: 'tier_198', price: 198, base: 1980, tag: '' },
      { id: 'tier_328', price: 328, base: 3280, tag: '' },
      { id: 'tier_648', price: 648, base: 6480, tag: '最划算' },
    ],
    monthly: {
      id: 'monthly_card',
      name: '打工人月卡',
      price: 30,
      immediate: 300,
      daily: 90,
      days: 30,
      desc: '购买立刻获得 300 工资，此后 30 天内每天首次进入游戏领取 90 工资。',
    },
  };

  const CONFIG = {
    version: '1.1.8',
    title: '不想上班',
    subtitle: '打工人抽卡模拟器',
    currencyName: '工资',
    currencySign: '¥',
    pullCost: { single: 160, ten: 1600 },
    workReward: 1600,
    startCurrency: 16000,
    storageKey: 'bxsb.save.v1',
  };

  /**
   * 成就表
   * metric 取 Achievements.metrics(state) 里的字段，target 为达成阈值；
   * op 为 lte 表示「越小越好」（例如 30 抽以内出金）。
   * 达成后自动发放 reward 工资，并累计 points 成就点。
   */
  /** 隐藏福利：随机触发的无厘头意外之财，weight 越大越常出现 */
  const BONUSES = [
    { id: 'boss_happy', title: '老板心情不错', desc: '老板路过工位，突然塞给你一叠钱：拿着，别声张。', amount: 1600, weight: 8 },
    { id: 'boss_666', title: '老板发了 666', desc: '群里刷了一排 666，手气最佳是你。', amount: 666, weight: 10 },
    { id: 'catch_fish', title: '抓到一条鱼', desc: '你真在工位上抓到一条鱼，行政按市价收购了。', amount: 666, weight: 6 },
    { id: 'hall_404', title: '楼道里捡到 404', desc: '一张皱巴巴的 404，问了一圈没人认领。', amount: 404, weight: 6 },
    { id: 'cold_joke', title: '老板讲了个冷笑话', desc: '全场只有你笑了，而且笑得很真诚。', amount: 233, weight: 6 },
    { id: 'envelope', title: '茶水间的神秘信封', desc: '没有署名，没有留言，只有钱。', amount: 1024, weight: 5 },
    { id: 'lottery', title: '年会阳光普照奖', desc: '虽然没抽到手机，但现金也挺好。', amount: 888, weight: 7 },
    { id: 'overtime_pay', title: '加班费到账', desc: '财务说：这次真的给你算上了。', amount: 996, weight: 7 },
    { id: 'tea_refund', title: '客户下午茶折现', desc: '奶茶没喝到，钱倒是到账了。', amount: 520, weight: 6 },
    { id: 'toilet_coin', title: '厕所捡到一枚硬币', desc: '你郑重地把它上交了，然后它变成了你的工资。', amount: 1, weight: 4 },
    { id: 'ex_colleague', title: '前同事请客退款', desc: '他离职前你垫的那顿饭，居然真的还了。', amount: 328, weight: 5 },
    { id: 'cat_payroll', title: '老板的猫踩了发薪键', desc: '财务系统手滑多打了一个零，没人发现。', amount: 6480, weight: 1 },
    { id: 'cat_payroll2', title: '财务手滑多打一个零', desc: '你说要退回去，财务说不用了，下个月扣。', amount: 2024, weight: 2 },
  ];

  const ACHIEVEMENTS = [
    { id: 'ach_first_pull', group: '抽卡', name: '初次打卡', desc: '完成第一次祈愿', metric: 'totalPulls', target: 1, points: 5, reward: 160 },
    { id: 'ach_ten_debut', group: '抽卡', name: '十连入门', desc: '完成一次十连祈愿', metric: 'tenPulls', target: 1, points: 5, reward: 160 },
    { id: 'ach_pull_100', group: '抽卡', name: '手气不错', desc: '累计祈愿 100 次', metric: 'totalPulls', target: 100, points: 10, reward: 800 },
    { id: 'ach_pull_500', group: '抽卡', name: '抽卡成瘾', desc: '累计祈愿 500 次', metric: 'totalPulls', target: 500, points: 20, reward: 3200 },
    { id: 'ach_pull_1000', group: '抽卡', name: '信仰之跃', desc: '累计祈愿 1000 次', metric: 'totalPulls', target: 1000, points: 30, reward: 6480 },

    { id: 'ach_first_five', group: '出金', name: '第一桶金', desc: '获得第一个五星', metric: 'fiveCount', target: 1, points: 10, reward: 320 },
    { id: 'ach_five_10', group: '出金', name: '五星星空', desc: '累计获得 10 个五星', metric: 'fiveCount', target: 10, points: 20, reward: 1600 },
    { id: 'ach_double_five', group: '出金', name: '双黄蛋', desc: '一次十连中出现 2 个五星', metric: 'maxFiveInTen', target: 2, points: 30, reward: 6480 },
    { id: 'ach_early_five', group: '出金', name: '欧皇附体', desc: '在 30 抽以内获得五星', metric: 'bestPity', target: 30, op: 'lte', points: 20, reward: 1600 },
    { id: 'ach_hard_pity', group: '出金', name: '保底之神', desc: '在第 80 抽之后才获得五星', metric: 'latePityCount', target: 1, points: 20, reward: 1600 },
    { id: 'ach_lose_streak', group: '出金', name: '非酋的尊严', desc: '累计 3 次五星都不是 UP', metric: 'lostFifties', target: 3, points: 20, reward: 1600 },
    { id: 'ach_up_first', group: '出金', name: '命中注定', desc: '获得 UP 限定五星', metric: 'upFiveCount', target: 1, points: 10, reward: 320 },

    { id: 'ach_first_four', group: '收集', name: '紫气东来', desc: '获得第一个四星', metric: 'fourCount', target: 1, points: 5, reward: 160 },
    { id: 'ach_four_10', group: '收集', name: '四星常客', desc: '累计获得 10 个四星', metric: 'fourCount', target: 10, points: 10, reward: 640 },
    { id: 'ach_collect_15', group: '收集', name: '收藏入门', desc: '图鉴收集 15 种', metric: 'ownedKinds', target: 15, points: 15, reward: 960 },
    { id: 'ach_all_four', group: '收集', name: '部门团建', desc: '集齐全部 12 位四星打工人', metric: 'ownedFourKinds', target: 12, points: 25, reward: 3200 },
    { id: 'ach_all_three', group: '收集', name: '办公室仓库', desc: '集齐全部 12 件三星办公用品', metric: 'ownedThreeKinds', target: 12, points: 15, reward: 960 },
    { id: 'ach_limited', group: '收集', name: '限定拥有者', desc: '招到限定五星「摸鱼教父」', metric: 'hasLimited', target: 1, points: 20, reward: 1600 },
    { id: 'ach_collect_all', group: '收集', name: '打工图鉴全收录', desc: '集齐全部 31 种角色与物品', metric: 'ownedKinds', target: 31, points: 50, reward: 12960 },

    { id: 'ach_work_10', group: '资源', name: '白嫖之王', desc: '点「上个班」10 次', metric: 'workCount', target: 10, points: 5, reward: 800 },
    { id: 'ach_spend_16000', group: '资源', name: '工资流水', desc: '累计消耗 16000 工资', metric: 'spendCurrency', target: 16000, points: 10, reward: 800 },
    { id: 'ach_topup_648', group: '资源', name: '氪金玩家', desc: '模拟充值累计 648 元', metric: 'topupTotal', target: 648, points: 20, reward: 1600 },
    { id: 'ach_monthly', group: '资源', name: '月卡党', desc: '开通打工人月卡', metric: 'monthlyActive', target: 1, points: 10, reward: 320 },
    { id: 'ach_broke', group: '资源', name: '身无分文', desc: '余额不足一次单抽', metric: 'currencyLt160', target: 1, points: 5, reward: 160 },

    // 隐藏成就：未达成前在面板里只显示「???」，不透露条件
    { id: 'ach_hidden_triple', group: '隐藏', hidden: true, name: '三黄蛋', desc: '一次十连中出现 3 个五星', metric: 'maxFiveInTen', target: 3, points: 50, reward: 12960 },
    { id: 'ach_hidden_firstpull', group: '隐藏', hidden: true, name: '一发入魂', desc: '在 5 抽以内获得五星', metric: 'bestPity', target: 5, op: 'lte', points: 30, reward: 6480 },
    { id: 'ach_hidden_loser', group: '隐藏', hidden: true, name: '非酋之王', desc: '累计 10 次五星都不是 UP', metric: 'lostFifties', target: 10, points: 30, reward: 6480 },
    { id: 'ach_hidden_oneday', group: '隐藏', hidden: true, name: '摸鱼的一天', desc: '在同一天里抽卡 100 次', metric: 'maxDayPulls', target: 100, points: 20, reward: 1600 },
    { id: 'ach_hidden_night', group: '隐藏', hidden: true, name: '深夜打工人', desc: '在凌晨 0 点到 5 点之间抽卡', metric: 'nightPulls', target: 1, points: 15, reward: 960 },
    { id: 'ach_hidden_slacker', group: '隐藏', hidden: true, name: '摆烂到底', desc: '累计点「上个班」50 次', metric: 'workCount', target: 50, points: 20, reward: 3200 },
  ];

  const ALL = FIVE.concat(FOUR, THREE);
  const byId = {};
  ALL.forEach((item) => {
    byId[item.id] = item;
  });

  return {
    ELEMENTS: ELEMENTS,
    CHARACTERS: FIVE.concat(FOUR),
    FIVE: FIVE,
    FOUR: FOUR,
    THREE: THREE,
    ALL: ALL,
    POOLS: POOLS,
    SHOP: SHOP,
    ACHIEVEMENTS: ACHIEVEMENTS,
    BONUSES: BONUSES,
    CONFIG: CONFIG,
    itemById: function (id) {
      return byId[id] || null;
    },
    poolById: function (id) {
      for (let i = 0; i < POOLS.length; i++) {
        if (POOLS[i].id === id) return POOLS[i];
      }
      return POOLS[0];
    },
  };
})();
