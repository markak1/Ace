/**
 * 主牌花色选择器
 */
Component({
  properties: {
    visible: { type: Boolean, value: false },
  },

  data: {
    selectedSuit: '',
  },

  observers: {
    'visible': function (v) {
      if (v) this.setData({ selectedSuit: '' });
    },
  },

  methods: {
    selectSuit(e) {
      this.setData({ selectedSuit: e.currentTarget.dataset.suit });
    },
    onConfirm() {
      if (!this.data.selectedSuit) return;
      this.triggerEvent('confirm', { suit: this.data.selectedSuit });
    },
    onCancel() {
      this.triggerEvent('cancel');
    },
  },
});
