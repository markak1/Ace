/**
 * 大厅页面
 */
const app = getApp();

Page({
  data: {
    userInfo: {},
    userId: '',
    selectedMode: 'single',
    difficulty: 'normal',
    baseCups: 1,
    soundEnabled: true,
    showRulesModal: false,
    showRoomModal: false,
    roomCode: '',
  },

  onLoad() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo') || {};
    const userId = wx.getStorageSync('userId') || '';
    this.setData({ userInfo, userId });
  },

  onShow() {
    // 检查登录状态
    if (!this.data.userId) {
      this.login();
    }
  },

  login() {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 发送 code 到后端换取 openid
          // 此处简化处理，实际需要后端支持
          const userId = 'user_' + res.code.slice(-6);
          this.setData({ userId });
          wx.setStorageSync('userId', userId);
        }
      },
    });
  },

  selectMode(e) {
    const mode = e.currentTarget.dataset.mode;
    if (mode === 'join') {
      this.setData({ showRoomModal: true });
      return;
    }
    this.setData({ selectedMode: mode });
  },

  selectDifficulty(e) {
    this.setData({ difficulty: e.currentTarget.dataset.level });
  },

  adjustCups(e) {
    const delta = parseInt(e.currentTarget.dataset.delta);
    let cups = this.data.baseCups + delta;
    cups = Math.max(1, Math.min(10, cups));
    this.setData({ baseCups: cups });
  },

  toggleSound(e) {
    this.setData({ soundEnabled: e.detail.value });
  },

  startGame() {
    wx.vibrateShort({ type: 'light' });

    if (this.data.selectedMode === 'single') {
      // 单人模式
      wx.navigateTo({
        url: `/pages/game/game?mode=single&difficulty=${this.data.difficulty}&baseCups=${this.data.baseCups}&sound=${this.data.soundEnabled ? 1 : 0}`,
      });
    } else if (this.data.selectedMode === 'room') {
      // 创建房间（多人模式需要后端支持，此处简化处理）
      wx.navigateTo({
        url: `/pages/game/game?mode=room&baseCups=${this.data.baseCups}&sound=${this.data.soundEnabled ? 1 : 0}`,
      });
    }
  },

  showRules() {
    this.setData({ showRulesModal: true });
  },

  hideRules() {
    this.setData({ showRulesModal: false });
  },

  showHistory() {
    wx.showToast({ title: '开发中...', icon: 'none' });
  },

  onRoomInput(e) {
    this.setData({ roomCode: e.detail.value });
  },

  hideRoomModal() {
    this.setData({ showRoomModal: false, roomCode: '' });
  },

  joinRoom() {
    if (!this.data.roomCode) {
      wx.showToast({ title: '请输入房间号', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/game/game?mode=join&roomCode=${this.data.roomCode}&baseCups=${this.data.baseCups}`,
    });
  },

  onShareAppMessage() {
    return {
      title: '来玩腾冲幺子分！经典扑克牌游戏',
      path: '/pages/lobby/lobby',
      imageUrl: '/assets/images/share-cover.png',
    };
  },
});
