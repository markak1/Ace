/**
 * 腾冲幺子分 - 通用工具函数
 */

/**
 * 延迟执行
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 格式化时间
 */
function formatTime(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return [year, month, day].map(n => n.toString().padStart(2, '0')).join('-') +
    ' ' + [hour, minute, second].map(n => n.toString().padStart(2, '0')).join(':');
}

/**
 * 生成唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * 洗牌动画时长
 */
function getShuffleDuration() {
  return 800;
}

/**
 * 出牌动画时长
 */
function getPlayCardDuration() {
  return 300;
}

/**
 * 显示 toast
 */
function showToast(title, icon = 'none') {
  wx.showToast({ title, icon, duration: 2000 });
}

/**
 * 显示模态框
 */
function showModal(title, content) {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      showCancel: false,
      success: (res) => resolve(res.confirm),
    });
  });
}

/**
 * 播放振动反馈
 */
function vibrate(type = 'light') {
  if (type === 'heavy') {
    wx.vibrateLong();
  } else {
    wx.vibrateShort({ type: 'light' });
  }
}

/**
 * 花色对应的颜色
 */
function getSuitColor(suit) {
  const colors = {
    hearts: '#e74c3c',
    diamonds: '#e67e22',
    spades: '#2c3e50',
    clubs: '#27ae60',
    joker_red: '#e74c3c',
    joker_black: '#2c3e50',
  };
  return colors[suit] || '#333';
}

/**
 * 花色对应的CSS class后缀
 */
function getSuitClass(suit, isJoker, rank) {
  if (isJoker) {
    return rank === 'BIG_JOKER' ? 'joker-red' : 'joker-black';
  }
  return suit;
}

module.exports = {
  delay,
  formatTime,
  generateId,
  getShuffleDuration,
  getPlayCardDuration,
  showToast,
  showModal,
  vibrate,
  getSuitColor,
  getSuitClass,
};
