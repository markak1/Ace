/**
 * 腾冲幺子分 - 音效管理器
 * 使用微信小程序 AudioContext 播放内置音效
 */

class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.enabled = true;
    this.volume = 0.5;
  }

  init() {
    try {
      this.audioCtx = wx.createInnerAudioContext();
      this.audioCtx.volume = this.volume;
    } catch (e) {
      console.warn('音频初始化失败', e);
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (this.audioCtx) {
      this.audioCtx.volume = enabled ? this.volume : 0;
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioCtx && this.enabled) {
      this.audioCtx.volume = this.volume;
    }
  }

  /**
   * 播放出牌音效
   */
  playCard() {
    this._playTone(800, 80, 'sine');
  }

  /**
   * 播放赢牌音效
   */
  playWin() {
    this._playTone(523, 150, 'sine');
    setTimeout(() => this._playTone(659, 150, 'sine'), 150);
    setTimeout(() => this._playTone(784, 200, 'sine'), 300);
  }

  /**
   * 播放输牌音效
   */
  playLose() {
    this._playTone(400, 200, 'sine');
    setTimeout(() => this._playTone(350, 200, 'sine'), 200);
    setTimeout(() => this._playTone(300, 300, 'sine'), 400);
  }

  /**
   * 播放叫分音效
   */
  playBid() {
    this._playTone(600, 100, 'triangle');
  }

  /**
   * 播放加倍音效
   */
  playMultiply() {
    this._playTone(1000, 100, 'square');
    setTimeout(() => this._playTone(1200, 100, 'square'), 100);
  }

  /**
   * 播放光头音效
   */
  playGuangtou() {
    this._playTone(200, 300, 'sawtooth');
    setTimeout(() => this._playTone(150, 500, 'sawtooth'), 300);
  }

  /**
   * 播放按钮点击
   */
  playClick() {
    this._playTone(1000, 50, 'sine');
  }

  _playTone(freq, duration, type = 'sine') {
    if (!this.enabled) return;
    // 使用 InnerAudioContext 模拟简单音效
    try {
      const ctx = wx.createInnerAudioContext();
      ctx.volume = this.volume;
      ctx.obeyMuteSwitch = false;
      // 微信小程序没有 OscillatorNode，使用简短的静默文件
      // 实际项目中应替换为预制的音频文件
      ctx.destroy();
    } catch (e) {
      // 静默失败
    }
  }
}

// 单例
const soundManager = new SoundManager();

module.exports = soundManager;
