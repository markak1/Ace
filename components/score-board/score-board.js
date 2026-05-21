/**
 * 计分板组件
 */
Component({
  properties: {
    roundNumber: { type: Number, value: 1 },
    trumpSuit: { type: String, value: '' },
    trumpName: { type: String, value: '' },
    trumpSuitIcon: { type: String, value: '' },
    bidScore: { type: Number, value: 0 },
    attackScore: { type: Number, value: 0 },
    defenseScore: { type: Number, value: 0 },
    defenseNeeded: { type: Number, value: 0 },
    attackPlayers: { type: Array, value: [] },
    defensePlayers: { type: Array, value: [] },
    trickCount: { type: Number, value: 0 },
    multiplyName: { type: String, value: '' },
  },

  data: {
    collapsed: false,
    attackPercent: 0,
    defensePercent: 0,
  },

  observers: {
    'attackScore, bidScore': function (a, b) {
      this.setData({ attackPercent: b > 0 ? Math.min(100, (a / b) * 100) : 0 });
    },
    'defenseScore, defenseNeeded': function (d, n) {
      this.setData({ defensePercent: n > 0 ? Math.min(100, (d / n) * 100) : 0 });
    },
  },

  methods: {
    toggleCollapse() {
      this.setData({ collapsed: !this.data.collapsed });
    },
  },
});
