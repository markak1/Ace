/**
 * 叫分面板组件
 */
Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    bidOptions: {
      type: Array,
      value: [],
    },
    maxBid: {
      type: Number,
      value: 0,
    },
    currentBidder: {
      type: Number,
      value: -1,
    },
    playerNames: {
      type: Array,
      value: [],
    },
    bidRecords: {
      type: Array,
      value: [],
    },
  },

  data: {
    selectedBid: null,
  },

  observers: {
    'visible': function (v) {
      if (v) {
        this.setData({ selectedBid: null });
      }
    },
  },

  methods: {
    selectBid(e) {
      const score = parseInt(e.currentTarget.dataset.score);
      this.setData({ selectedBid: score });
    },

    onConfirm() {
      if (this.data.selectedBid === null) return;
      this.triggerEvent('confirm', { score: this.data.selectedBid });
    },

    onCancel() {
      this.triggerEvent('cancel');
    },
  },
});
