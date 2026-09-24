/**
 * 音效配方校验：用假的 AudioContext 跑一遍所有音效。
 * 重点校验浏览器会直接抛错的用法（例如 exponentialRampToValueAtTime 目标为 0）。
 * 用法： node tools/audio-test.js
 */
const path = require('path');

let nodeCount = 0;

class FakeParam {
  constructor(label) {
    this.label = label;
    this.value = 0;
  }
  setValueAtTime(v, t) {
    assertFinite(v, t, this.label + '.setValueAtTime');
  }
  exponentialRampToValueAtTime(v, t) {
    // 真实浏览器：目标值必须是非零正数，否则抛 RangeError
    if (!(typeof v === 'number' && isFinite(v) && v > 0)) {
      throw new Error(this.label + '.exponentialRampToValueAtTime 目标值必须为正数，收到 ' + v);
    }
    assertFinite(t, v, this.label + '.exponentialRampToValueAtTime');
  }
  linearRampToValueAtTime(v, t) {
    assertFinite(v, t, this.label + '.linearRampToValueAtTime');
  }
}

function assertFinite(v, t, where) {
  if (typeof v !== 'number' || !isFinite(v)) throw new Error(where + ' 收到非法值 ' + v);
  if (typeof t !== 'number' || !isFinite(t)) throw new Error(where + ' 收到非法时间 ' + t);
  if (t < 0) throw new Error(where + ' 时间为负数 ' + t);
}

class FakeNode {
  constructor(kind) {
    this.kind = kind;
    this.outputs = [];
    nodeCount += 1;
  }
  connect(dest) {
    this.outputs.push(dest);
    return dest; // 与浏览器一致，支持链式 connect
  }
  disconnect() {}
  start(t) {
    assertFinite(t, 0, this.kind + '.start 的起始时间');
  }
  stop(t) {
    assertFinite(t, 0, this.kind + '.stop 的结束时间');
  }
}

class FakeGain extends FakeNode {
  constructor() {
    super('gain');
    this.gain = new FakeParam('gain.gain');
  }
}

class FakeOscillator extends FakeNode {
  constructor() {
    super('oscillator');
    this.frequency = new FakeParam('oscillator.frequency');
    this.type = 'sine';
  }
}

class FakeFilter extends FakeNode {
  constructor() {
    super('filter');
    this.frequency = new FakeParam('filter.frequency');
    this.type = 'lowpass';
    this.Q = { value: 0 };
  }
}

class FakeBufferSource extends FakeNode {
  constructor() {
    super('bufferSource');
    this.buffer = null;
    this.loop = false;
  }
}

class FakeBuffer {
  constructor(channels, length) {
    this.length = length;
    this._data = new Float32Array(length);
  }
  getChannelData() {
    return this._data;
  }
}

class FakeAudioContext {
  constructor() {
    this.sampleRate = 48000;
    this.currentTime = 1.5;
    this.state = 'running';
    this.destination = new FakeNode('destination');
  }
  createGain() {
    return new FakeGain();
  }
  createOscillator() {
    return new FakeOscillator();
  }
  createBiquadFilter() {
    return new FakeFilter();
  }
  createBufferSource() {
    return new FakeBufferSource();
  }
  createBuffer(channels, length) {
    return new FakeBuffer(channels, length);
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
}

global.window = global;
window.AudioContext = FakeAudioContext;
require(path.join(__dirname, '..', 'js', 'audio.js'));

const RECIPES = ['click', 'burst3', 'burst4', 'burst5', 'fly', 'land', 'sparkle', 'coin', 'achievement'];
const results = [];
let failed = 0;

RECIPES.forEach(function (name) {
  const before = nodeCount;
  try {
    window.Sound.play(name);
    const created = nodeCount - before;
    const ok = created > 0;
    if (!ok) failed += 1;
    results.push((ok ? '  [通过] ' : '  [失败] ') + name + ' — 生成 ' + created + ' 个音频节点');
  } catch (err) {
    failed += 1;
    results.push('  [失败] ' + name + ' — ' + err.message);
  }
});

// 静音开关必须真的静音
const beforeMute = nodeCount;
window.Sound.setEnabled(false);
window.Sound.play('burst5');
const mutedCreated = nodeCount - beforeMute;
if (mutedCreated !== 0) failed += 1;
results.push((mutedCreated === 0 ? '  [通过] ' : '  [失败] ') + '关闭音效后不再产生音频节点（实际 ' + mutedCreated + '）');

window.Sound.setEnabled(true);
const beforeResume = nodeCount;
window.Sound.play('click');
if (nodeCount - beforeResume === 0) failed += 1;
results.push((nodeCount - beforeResume > 0 ? '  [通过] ' : '  [失败] ') + '重新开启后恢复发声');

// 未知音效名不应抛错
try {
  window.Sound.play('不存在的音效');
  results.push('  [通过] 未知音效名被安全忽略');
} catch (err) {
  failed += 1;
  results.push('  [失败] 未知音效名抛错: ' + err.message);
}

console.log('=== 音效配方校验（共 ' + RECIPES.length + ' 个）===');
console.log(results.join('\n'));
console.log('\n音频节点总数: ' + nodeCount);
console.log(failed === 0 ? '全部校验通过。' : '存在 ' + failed + ' 项未通过。');
process.exit(failed === 0 ? 0 : 1);
