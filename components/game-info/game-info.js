/**
 * 游戏信息条组件
 */
const { PHASE } = require('../../engine/game-engine');

const PHASE_NAMES = {
  [PHASE.WAITING]: '等待中',
  [PHASE.DEALING]: '发牌中',
  [PHASE.TRUMP_SELECT]: '选主牌',
  [PHASE.BIDDING]: '叫分',
  [PHASE.DI_PAI]: '扑底牌',
  [PHASE.MULTIPLY]: '加倍',
  [PHASE.PLAYING]: '出牌',
  [PHASE.ROUND_END]: '结算',
  [PHASE.GAME_OVER]: '结束',
};

Component({
  properties: {
    phase: { type: String, value: '' },
    trumpName: { type: String, value: '' },
    trumpSuitIcon: { type: String, value: '' },
    bidScore: { type: Number, value: 0 },
  },

  data: {
    phaseName: '',
    trumpDisplay: '',
    bidDisplay: '',
  },

  observers: {
    'phase': function (p) {
      this.setData({ phaseName: PHASE_NAMES[p] || '' });
    },
    'trumpName, trumpSuitIcon': function (name, icon) {
      if (name) {
        this.setData({ trumpDisplay: `${icon} ${name}` });
      }
    },
    'bidScore': function (s) {
      if (s > 0) this.setData({ bidDisplay: `${s}分` });
    },
  },

  methods: {
    onShowRules() {
      this.triggerEvent('showrules');
    },
  },
});
