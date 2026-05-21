/**
 * 扑克牌组件 - 显示单张扑克牌
 */
Component({
  properties: {
    card: {
      type: Object,
      value: null,
    },
    faceDown: {
      type: Boolean,
      value: false,
    },
    selected: {
      type: Boolean,
      value: false,
    },
    playable: {
      type: Boolean,
      value: true,
    },
    size: {
      type: String,
      value: 'normal', // small, normal, large
    },
    showScore: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    suitSymbol: '',
    rankText: '',
    colorClass: '',
    isJoker: false,
    jokerText: '',
    sizeClass: '',
  },

  observers: {
    'card, faceDown': function (card, faceDown) {
      if (!card || faceDown) {
        this.setData({ isJoker: false });
        return;
      }

      const symbols = { hearts: '♥', spades: '♠', clubs: '♣', diamonds: '♦' };
      const isJoker = card.isJoker;

      let suitSymbol = '';
      let rankText = card.rank;
      let colorClass = '';
      let jokerText = '';

      if (isJoker) {
        jokerText = card.rank === 'BIG_JOKER' ? '大鬼' : '小鬼';
        colorClass = card.rank === 'BIG_JOKER' ? 'card-red' : 'card-black';
      } else {
        suitSymbol = symbols[card.suit] || '';
        colorClass = (card.suit === 'hearts' || card.suit === 'diamonds') ? 'card-red' : 'card-black';
      }

      this.setData({ suitSymbol, rankText, colorClass, isJoker, jokerText });
    },
    'size': function (size) {
      this.setData({ sizeClass: `card-${size}` });
    },
  },

  methods: {
    onTap() {
      if (!this.data.playable || this.data.faceDown) return;
      this.triggerEvent('tap', { card: this.properties.card });
    },
  },
});
