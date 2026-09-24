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
    title: '不想上班',
    subtitle: '打工人抽卡模拟器',
    currencyName: '工资',
    currencySign: '¥',
    pullCost: { single: 160, ten: 1600 },
    workReward: 1600,
    startCurrency: 16000,
    storageKey: 'bxsb.save.v1',
  };

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
