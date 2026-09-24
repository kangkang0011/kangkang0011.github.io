/**
 * 音效：用 Web Audio 实时合成，不依赖任何音频文件。
 * 浏览器要求音频上下文必须由用户手势创建，所以这里全部懒初始化。
 */
window.Sound = (function () {
  'use strict';

  let ctx = null;
  let master = null;
  let noiseCache = null;
  let enabled = true;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch (err) {
      return null;
    }
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    return ctx;
  }

  function noiseBuffer() {
    if (noiseCache) return noiseCache;
    const len = Math.floor(ctx.sampleRate * 2);
    noiseCache = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseCache.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return noiseCache;
  }

  /** 单个振荡器音符：支持滑音与指数衰减包络 */
  function tone(opt) {
    const t0 = opt.at;
    const dur = opt.dur;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opt.type || 'sine';
    osc.frequency.setValueAtTime(opt.from, t0);
    if (opt.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opt.to), t0 + dur);
    const peak = opt.gain === undefined ? 0.2 : opt.gain;
    const attack = opt.attack === undefined ? 0.008 : opt.attack;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  /** 过滤后的噪声：用来做气流、爆音、沙沙声 */
  function noise(opt) {
    const t0 = opt.at;
    const dur = opt.dur;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer();
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = opt.type || 'bandpass';
    filter.Q.value = opt.q === undefined ? 1 : opt.q;
    filter.frequency.setValueAtTime(opt.from, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, opt.to || opt.from), t0 + dur);
    const gain = ctx.createGain();
    const peak = opt.gain === undefined ? 0.2 : opt.gain;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + dur * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  /** 铃铛音色：基音 + 两个泛音，用于出金与成就 */
  function bell(freq, at, dur, gain) {
    const partials = [
      { mul: 1, g: 1 },
      { mul: 2.01, g: 0.42 },
      { mul: 3.03, g: 0.18 },
    ];
    partials.forEach(function (p) {
      tone({
        at: at,
        dur: dur * (p.mul > 1 ? 0.7 : 1),
        type: 'sine',
        from: freq * p.mul,
        gain: (gain === undefined ? 0.16 : gain) * p.g,
        attack: 0.012,
      });
    });
  }

  const RECIPES = {
    // 按下抽卡按钮
    click: function (t) {
      tone({ at: t, dur: 0.06, type: 'triangle', from: 1500, to: 900, gain: 0.08 });
      noise({ at: t, dur: 0.05, from: 3000, to: 1200, q: 0.8, gain: 0.06 });
    },

    // 三星：轻微气流，不抢戏
    burst3: function (t) {
      noise({ at: t, dur: 0.45, from: 260, to: 900, q: 1.2, gain: 0.12 });
      tone({ at: t + 0.02, dur: 0.3, type: 'sine', from: 320, to: 180, gain: 0.08 });
    },

    // 四星：紫色微光，气流 + 双音
    burst4: function (t) {
      noise({ at: t, dur: 0.55, from: 320, to: 2400, q: 1.1, gain: 0.16 });
      tone({ at: t + 0.05, dur: 0.5, type: 'triangle', from: 440, to: 200, gain: 0.12 });
      bell(880, t + 0.22, 0.7, 0.1);
      bell(1318, t + 0.32, 0.8, 0.08);
    },

    // 五星：金光乍现，低频冲击 + 上升音阶 + 高频闪
    burst5: function (t) {
      noise({ at: t, dur: 1.05, from: 180, to: 6400, q: 0.9, gain: 0.22 });
      tone({ at: t, dur: 0.7, type: 'sine', from: 150, to: 48, gain: 0.34 });
      tone({ at: t + 0.03, dur: 0.5, type: 'triangle', from: 700, to: 240, gain: 0.14 });
      [523, 659, 784, 1046, 1318].forEach(function (f, i) {
        bell(f, t + 0.34 + i * 0.11, 1.1, 0.13);
      });
      noise({ at: t + 0.5, dur: 1.1, from: 4200, to: 9000, q: 0.6, gain: 0.09 });
    },

    // 稀有卡缩小飞回结果格
    fly: function (t) {
      noise({ at: t, dur: 0.6, from: 2600, to: 420, q: 1.4, gain: 0.12 });
    },

    // 落位
    land: function (t) {
      tone({ at: t, dur: 0.18, type: 'triangle', from: 240, to: 82, gain: 0.24 });
      noise({ at: t, dur: 0.09, from: 1800, to: 500, q: 0.7, gain: 0.1 });
    },

    // 普通结果翻开
    sparkle: function (t) {
      bell(1760, t, 0.28, 0.07);
      bell(2637, t + 0.05, 0.24, 0.05);
    },

    // 工资到账 / 充值成功
    coin: function (t) {
      tone({ at: t, dur: 0.09, type: 'square', from: 1568, gain: 0.07 });
      tone({ at: t + 0.08, dur: 0.22, type: 'square', from: 2093, gain: 0.06 });
      tone({ at: t + 0.08, dur: 0.3, type: 'sine', from: 3136, gain: 0.03 });
    },

    // 成就达成
    achievement: function (t) {
      [784, 1046, 1318, 1568].forEach(function (f, i) {
        bell(f, t + i * 0.1, 1.0, 0.12);
      });
      noise({ at: t + 0.1, dur: 0.9, from: 5000, to: 9000, q: 0.7, gain: 0.06 });
    },
  };

  function play(name) {
    if (!enabled) return;
    const ac = ensure();
    if (!ac || !RECIPES[name]) return;
    if (ac.state === 'suspended' && ac.resume) ac.resume();
    try {
      RECIPES[name](ac.currentTime + 0.01);
    } catch (err) {
      /* 音效失败不影响游戏 */
    }
  }

  /** 首次用户手势时解锁音频上下文（移动端 Safari 需要） */
  function unlock() {
    const ac = ensure();
    if (ac && ac.state === 'suspended' && ac.resume) ac.resume();
  }

  function setEnabled(value) {
    enabled = !!value;
    if (enabled) unlock();
  }

  function isEnabled() {
    return enabled;
  }

  return {
    play: play,
    unlock: unlock,
    setEnabled: setEnabled,
    isEnabled: isEnabled,
  };
})();
