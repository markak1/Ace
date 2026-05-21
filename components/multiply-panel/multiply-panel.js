/**
 * 倍率面板组件
 */
Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    team: {
      type: String,
      value: 'defense', // defense=吃牌方, attack=打牌方
    },
    baseCups: {
      type: Number,
      value: 1,
    },
    minLevel: {
      type: Number,
      value: 0,
    },
  },

  data: {
    selectedLevel: 0,
  },

  observers: {
    'visible': function (v) {
      if (v) this.setData({ selectedLevel: this.properties.minLevel });
    },
  },

  methods: {
    selectLevel(e) {
      const level = parseInt(e.currentTarget.dataset.level);
      if (level < this.properties.minLevel) return;
      this.setData({ selectedLevel: level });
    },
    onConfirm() {
      this.triggerEvent('confirm', { level: this.data.selectedLevel });
    },
    onCancel() {
      this.triggerEvent('cancel');
    },
  },
});
