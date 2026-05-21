/**
 * 游戏桌面页面 - 腾冲幺子分核心对局
 */
const { YaoziFenEngine, PHASE, SUIT_NAMES, SUIT_SYMBOLS, MULTIPLY_NAMES, getCardDisplay, isScoreCard, isTrump } = require('../../engine/game-engine');
const AIPlayer = require('../../engine/ai-player');
const { delay, vibrate } = require('../../utils/common');

Page({
  data: {
    // 游戏状态
    phase: PHASE.WAITING,
    phaseText: '准备中',

    // 玩家数据
    players: [
      { id: 'local', name: '我', avatar: '', hand: [], cardCount: 0, team: 'attack' },
      { id: 'ai1', name: '左边玩家', avatar: '', hand: [], cardCount: 0, team: 'defense' },
      { id: 'ai2', name: '对面玩家', avatar: '', hand: [], cardCount: 0, team: 'attack' },
      { id: 'ai3', name: '右边玩家', avatar: '', hand: [], cardCount: 0, team: 'defense' },
    ],

    // 本地玩家
    localPlayerIndex: 0,

    // 主牌
    trumpSuit: '',
    trumpName: '',

    // 叫分
    showBidPanel: false,
    bidOptions: [],
    maxBid: 0,
    currentBidder: -1,
    bidRecords: [],
    bidScore: 0,
    declarer: -1,

    // 底牌
    showDiPai: false,
    diPai: [],
    diPaiMode: false, // 是否在换底牌
    selectedCards: [],

    // 出牌
    currentTrick: [], // [{playerIndex, card}]
    currentPlayer: -1,
    trickLeader: -1,
    playableCardIds: [],
    trickResult: null,
    showTrickResult: false,

    // 倍率
    showMultiplyPanel: false,
    multiplyTeam: 'defense',
    multiplyMinLevel: 0,
    multiplyName: '',

    // 计分
    attackScore: 0,
    defenseScore: 0,
    defenseNeeded: 0,
    trickCount: 0,

    // 结算
    showResult: false,
    result: null,

    // 主牌选择
    showTrumpSelector: false,

    // 消息提示
    message: '',
    showMessage: false,

    // 游戏模式
    mode: 'single',
    difficulty: 'normal',
    baseCups: 1,
    roundNumber: 1,
  },

  engine: null,
  ai: null,
  isProcessing: false,

  onLoad(options) {
    const { mode = 'single', difficulty = 'normal', baseCups = 1, sound = 1 } = options;
    this.setData({
      mode,
      difficulty,
      baseCups: parseInt(baseCups) || 1,
    });

    this.engine = new YaoziFenEngine();
    this.ai = new AIPlayer(difficulty);

    this.initGame();
  },

  onUnload() {
    this.engine = null;
  },

  // ==================== 游戏初始化 ====================

  initGame() {
    const playerList = [
      { id: 'local', name: '我', avatar: '' },
      { id: 'ai1', name: '张三', avatar: '' },
      { id: 'ai2', name: '李四', avatar: '' },
      { id: 'ai3', name: '王五', avatar: '' },
    ];

    this.engine.initPlayers(playerList, 0);
    this.engine.baseCups = this.data.baseCups;

    this.showMessage_('发牌中...', 1000);
    setTimeout(() => this.dealCards(), 1200);
  },

  dealCards() {
    const firstBidder = (this.data.roundNumber - 1) % 4;
    const result = this.engine.dealCards(firstBidder);

    // 更新玩家手牌
    const players = this.data.players.map((p, i) => ({
      ...p,
      hand: i === 0 ? result.hands[i] : [], // 只有本地玩家可见手牌
      cardCount: result.hands[i].length,
    }));

    this.setData({ players, diPai: result.diPai });
    this.showMessage_('请叫分', 1500);

    setTimeout(() => this.startBidding(), 1600);
  },

  // ==================== 叫分流程 ====================

  startBidding() {
    const state = this.engine.getState();
    const bidOptions = this.engine.getBidOptions();

    this.setData({
      phase: PHASE.BIDDING,
      currentBidder: state.currentBidder,
      bidOptions,
      maxBid: state.maxBid,
      bidRecords: [],
    });

    this.processBidTurn();
  },

  processBidTurn() {
    if (this.isProcessing) return;

    const state = this.engine.getState();
    if (state.phase !== PHASE.BIDDING) return;

    const currentBidder = state.currentBidder;
    this.setData({ currentBidder });

    if (currentBidder === 0) {
      // 本地玩家叫分
      this.setData({
        showBidPanel: true,
        bidOptions: this.engine.getBidOptions(),
        maxBid: state.maxBid,
        bidRecords: this.engine.bids.map(b => ({
          playerIndex: b.playerIndex,
          name: this.data.players[b.playerIndex].name,
          score: b.score,
        })),
      });
    } else {
      // AI叫分
      this.isProcessing = true;
      const aiHand = this.engine.players[currentBidder].hand;
      const bidScore = this.ai.decideBid(aiHand, state.maxBid, this.engine.bids);

      setTimeout(() => {
        this.handleBidResult(currentBidder, bidScore);
        this.isProcessing = false;
      }, 1000);
    }
  },

  handleBidConfirm(e) {
    const score = e.detail.score;
    this.setData({ showBidPanel: false });
    this.handleBidResult(0, score);
  },

  handleBidCancel() {
    this.setData({ showBidPanel: false });
  },

  handleBidResult(playerIndex, score) {
    const result = this.engine.placeBid(playerIndex, score);

    if (!result.success) {
      if (playerIndex === 0) {
        wx.showToast({ title: result.message, icon: 'none' });
        this.setData({ showBidPanel: true });
      }
      return;
    }

    // 更新叫分记录
    const bidRecords = this.engine.bids.map(b => ({
      playerIndex: b.playerIndex,
      name: this.data.players[b.playerIndex].name,
      score: b.score,
    }));

    this.setData({
      bidRecords,
      maxBid: this.engine.maxBid,
    });

    // 显示叫分结果
    const playerName = this.data.players[playerIndex].name;
    const scoreText = score > 0 ? `${score}分` : '不加';
    this.showMessage_(`${playerName}: ${scoreText}`, 800);

    if (result.bidComplete) {
      if (result.noBid) {
        // 没人叫分，重新发牌
        this.showMessage_('没人叫分，重新发牌', 2000);
        setTimeout(() => this.dealCards(), 2200);
        return;
      }

      // 叫分结束
      this.setData({
        declarer: result.declarer,
        bidScore: result.bidScore,
      });

      const declarerName = this.data.players[result.declarer].name;
      this.showMessage_(`${declarerName}叫了${result.bidScore}分`, 1500);

      setTimeout(() => {
        if (result.declarer === 0) {
          // 本地玩家是庄家，选主牌
          this.setData({ showTrumpSelector: true });
        } else {
          // AI选主牌
          this.aiSelectTrump();
        }
      }, 1600);
      return;
    }

    // 下一个叫分者
    setTimeout(() => this.processBidTurn(), 1000);
  },

  aiSelectTrump() {
    const aiHand = this.engine.players[this.engine.declarer].hand;
    // AI选主牌：选手牌最多的花色
    const suitCount = { hearts: 0, spades: 0, clubs: 0, diamonds: 0 };
    aiHand.forEach(card => {
      if (!card.isJoker && suitCount.hasOwnProperty(card.suit)) {
        suitCount[card.suit]++;
      }
    });
    let bestSuit = 'hearts';
    let maxCount = 0;
    Object.entries(suitCount).forEach(([suit, count]) => {
      if (count > maxCount) {
        maxCount = count;
        bestSuit = suit;
      }
    });

    this.setTrumpSuit(bestSuit);
  },

  handleTrumpConfirm(e) {
    this.setData({ showTrumpSelector: false });
    this.setTrumpSuit(e.detail.suit);
  },

  handleTrumpCancel() {
    // 不允许取消
  },

  setTrumpSuit(suit) {
    const result = this.engine.setTrumpSuit(suit);
    const suitSymbol = SUIT_SYMBOLS[suit] || '';

    this.setData({
      trumpSuit: suit,
      trumpName: result.trumpName,
      phase: PHASE.DI_PAI,
    });

    this.showMessage_(`主牌：${suitSymbol} ${result.trumpName}`, 1500);

    setTimeout(() => {
      if (this.engine.declarer === 0) {
        // 本地玩家换底牌
        this.setData({ diPaiMode: true, showDiPai: true });
        this.showMessage_('请选择6张牌扑底（不能扑分牌）', 3000);
      } else {
        // AI换底牌
        this.aiSwapDiPai();
      }
    }, 1600);
  },

  // ==================== 底牌处理 ====================

  onCardTap(e) {
    if (!this.data.diPaiMode) {
      this.playCard_(e.detail.card);
      return;
    }

    const cardId = e.detail.card.id;
    let selected = [...this.data.selectedCards];

    const idx = selected.indexOf(cardId);
    if (idx >= 0) {
      selected.splice(idx, 1);
    } else {
      if (selected.length >= 6) {
        wx.showToast({ title: '最多选6张', icon: 'none' });
        return;
      }
      // 检查是否是分牌
      const card = this.data.players[0].hand.find(c => c.id === cardId);
      if (card && isScoreCard(card)) {
        wx.showToast({ title: '不能扑分牌', icon: 'none' });
        return;
      }
      selected.push(cardId);
    }

    this.setData({ selectedCards: selected });
  },

  confirmDiPai() {
    if (this.data.selectedCards.length !== 6) {
      wx.showToast({ title: '请选择6张牌', icon: 'none' });
      return;
    }

    const result = this.engine.swapDiPai(0, this.data.selectedCards);

    if (!result.success) {
      wx.showToast({ title: result.message, icon: 'none' });
      return;
    }

    const players = [...this.data.players];
    players[0].hand = result.newHand;
    players[0].cardCount = result.newHand.length;

    this.setData({
      players,
      diPai: result.newDiPai,
      diPaiMode: false,
      showDiPai: false,
      selectedCards: [],
    });

    this.showMessage_('底牌已换', 1000);
    setTimeout(() => this.startMultiplyPhase(), 1200);
  },

  aiSwapDiPai() {
    const aiIndex = this.engine.declarer;
    const aiHand = this.engine.players[aiIndex].hand;
    const diPai = this.engine.diPai;
    const discarded = this.ai.decideDiPai(aiHand, diPai, this.engine.trumpSuit);
    const result = this.engine.swapDiPai(aiIndex, discarded);

    if (result.success) {
      const players = [...this.data.players];
      players[aiIndex].cardCount = result.newHand.length;
      this.setData({
        players,
        diPai: result.newDiPai,
      });
    }

    this.showMessage_('庄家已换底牌', 1000);
    setTimeout(() => this.startMultiplyPhase(), 1200);
  },

  // ==================== 倍率阶段 ====================

  startMultiplyPhase() {
    this.setData({ phase: PHASE.MULTIPLY });

    // 简化：AI不做倍率操作，直接开始出牌
    // 如果是多人模式才显示倍率面板
    if (this.data.mode === 'single') {
      this.showMessage_('倍率阶段（跳过）', 1000);
      setTimeout(() => this.beginPlaying(), 1200);
    } else {
      this.startDefenseMultiply();
    }
  },

  startDefenseMultiply() {
    const defensePlayer = this.engine.players.findIndex(p => p.team === this.engine.defenseTeam);
    if (defensePlayer === 0) {
      this.setData({
        showMultiplyPanel: true,
        multiplyTeam: 'defense',
        multiplyMinLevel: 0,
      });
    } else {
      // AI不做倍率
      setTimeout(() => this.beginPlaying(), 500);
    }
  },

  handleMultiplyConfirm(e) {
    const level = e.detail.level;
    this.setData({ showMultiplyPanel: false });
    this.engine.placeMultiply(0, level);
    this.beginPlaying();
  },

  handleMultiplyCancel() {
    this.setData({ showMultiplyPanel: false });
    this.engine.placeMultiply(0, 0);
    this.beginPlaying();
  },

  // ==================== 出牌阶段 ====================

  beginPlaying() {
    const result = this.engine.startPlaying();
    const multiplyName = MULTIPLY_NAMES[Math.max(
      this.engine.multiply.defense,
      this.engine.multiply.attack
    )] || '';

    this.setData({
      phase: PHASE.PLAYING,
      currentPlayer: result.currentPlayer,
      trickLeader: result.trickLeader,
      multiplyName,
    });

    this.showMessage_('开始出牌', 800);
    setTimeout(() => this.processTurn(), 1000);
  },

  processTurn() {
    if (this.isProcessing) return;

    const state = this.engine.getState();
    if (state.phase !== PHASE.PLAYING) return;

    const currentPlayer = state.currentPlayer;
    this.setData({ currentPlayer });

    // 计算可出的牌
    const playableIds = currentPlayer === 0
      ? this.engine.getPlayableCards(0)
      : [];

    this.setData({ playableCardIds: playableIds });

    if (currentPlayer === 0) {
      // 本地玩家出牌
      const leaderName = this.data.players[state.trickLeader].name;
      if (this.engine.currentTrick.length === 0) {
        this.showMessage_('请你出牌', 2000);
      } else {
        this.showMessage_('请跟牌', 2000);
      }
    } else {
      // AI出牌
      this.isProcessing = true;
      const aiHand = this.engine.players[currentPlayer].hand;
      const aiCardId = this.ai.decidePlay(
        aiHand,
        this.engine.currentTrick,
        this.engine.trumpSuit,
        currentPlayer,
        this.engine.players,
        state,
      );

      setTimeout(() => {
        if (aiCardId) {
          this.engine.playCard(currentPlayer, aiCardId);
          this.updateTrickDisplay();
        }
        this.isProcessing = false;

        // 检查本轮是否结束
        if (this.engine.currentTrick.length === 4) {
          setTimeout(() => this.resolveTrick_(), 800);
        } else {
          setTimeout(() => this.processTurn(), 600);
        }
      }, 800);
    }
  },

  playCard_(card) {
    if (this.data.phase !== PHASE.PLAYING) return;
    if (this.data.currentPlayer !== 0) return;

    if (!this.data.playableCardIds.includes(card.id)) {
      wx.showToast({ title: '不能出这张牌', icon: 'none' });
      return;
    }

    vibrate('light');
    const result = this.engine.playCard(0, card.id);

    if (!result.success) {
      wx.showToast({ title: result.message, icon: 'none' });
      return;
    }

    // 更新手牌
    const players = [...this.data.players];
    players[0].hand = players[0].hand.filter(c => c.id !== card.id);
    players[0].cardCount = players[0].hand.length;
    this.setData({ players, selectedCards: [] });

    this.updateTrickDisplay();

    if (result.trickComplete) {
      setTimeout(() => this.resolveTrick_(), 600);
    } else {
      setTimeout(() => this.processTurn(), 400);
    }
  },

  updateTrickDisplay() {
    const currentTrick = this.engine.currentTrick;
    this.setData({ currentTrick: [...currentTrick] });

    // 更新其他玩家手牌数
    const players = [...this.data.players];
    this.engine.players.forEach((p, i) => {
      if (i !== 0) {
        players[i].cardCount = p.hand.length;
      }
    });
    this.setData({ players });
  },

  resolveTrick_() {
    const result = this.engine.resolveTrick();

    if (!result.trickResult) return;

    const winner = this.data.players[result.trickResult.winner];
    const trickScore = result.trickResult.score;

    this.setData({
      trickResult: result.trickResult,
      showTrickResult: true,
      trickCount: this.engine.trickCount,
      attackScore: this.engine.attackScore,
      defenseScore: this.engine.defenseScore,
      defenseNeeded: 100 - this.engine.maxBid + 5,
    });

    const scoreText = trickScore > 0 ? `，${trickScore}分` : '';
    this.showMessage_(`${winner.name}赢牌${scoreText}`, 1500);

    // 2秒后清除本轮牌面
    setTimeout(() => {
      this.setData({
        currentTrick: [],
        showTrickResult: false,
        trickResult: null,
      });

      if (result.gameOver) {
        this.handleGameOver();
      } else {
        this.processTurn();
      }
    }, 2000);
  },

  // ==================== 结算 ====================

  handleGameOver() {
    const result = this.engine.calculateResult();
    this.setData({
      phase: PHASE.ROUND_END,
      result,
      showResult: true,
    });
  },

  handleNextRound() {
    this.setData({
      showResult: false,
      result: null,
      roundNumber: this.data.roundNumber + 1,
      currentTrick: [],
      trickResult: null,
      showTrickResult: false,
      trumpSuit: '',
      trumpName: '',
      attackScore: 0,
      defenseScore: 0,
      trickCount: 0,
      declarer: -1,
      bidScore: 0,
      multiplyName: '',
      phase: PHASE.WAITING,
    });

    this.engine.reset();
    this.initGame();
  },

  handleBackToLobby() {
    wx.navigateBack();
  },

  // ==================== 辅助方法 ====================

  showMessage_(text, duration = 1500) {
    this.setData({ message: text, showMessage: true });
    setTimeout(() => {
      this.setData({ showMessage: false });
    }, duration);
  },

  showRules() {
    wx.navigateTo({ url: '/pages/lobby/lobby?showRules=1' });
  },

  onShareAppMessage() {
    return {
      title: '快来和我玩腾冲幺子分！',
      path: '/pages/lobby/lobby',
    };
  },
});
