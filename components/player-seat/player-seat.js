/**
 * 玩家座位组件 - 显示玩家信息、手牌、出牌区
 */
Component({
  properties: {
    player: {
      type: Object,
      value: null,
    },
    seatIndex: {
      type: Number,
      value: 0,
    },
    isCurrentPlayer: {
      type: Boolean,
      value: false,
    },
    isLocalPlayer: {
      type: Boolean,
      value: false,
    },
    playedCard: {
      type: Object,
      value: null,
    },
    trickResult: {
      type: Object,
      value: null,
    },
    trumpSuit: {
      type: String,
      value: '',
    },
    showHand: {
      type: Boolean,
      value: false,
    },
    team: {
      type: String,
      value: '',
    },
    position: {
      type: String,
      value: 'bottom', // bottom, left, top, right
    },
  },

  data: {
    positionClass: 'seat-bottom',
  },

  observers: {
    'position': function (pos) {
      this.setData({ positionClass: `seat-${pos}` });
    },
  },

  methods: {
    onCardTap(e) {
      this.triggerEvent('cardtap', e.detail);
    },
  },
});
