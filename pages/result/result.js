/**
 * 结算页面
 */
Page({
  data: {
    result: null,
  },

  onLoad(options) {
    // 从缓存获取结果
    const result = wx.getStorageSync('lastRoundResult');
    if (result) {
      this.setData({ result: JSON.parse(result) });
    }
  },

  onShareAppMessage() {
    const r = this.data.result;
    return {
      title: r ? `我在腾冲幺子分中${r.isGuangtou ? '吃了光头' : r.winnerLabel + '获胜'}！` : '来玩腾冲幺子分',
      path: '/pages/lobby/lobby',
    };
  },
});
