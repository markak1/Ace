/**
 * 腾冲幺子分 - 核心游戏引擎
 * 实现完整的牌局逻辑：发牌、叫分、出牌、计分、倍率
 */

// ==================== 常量定义 ====================

/** 花色 */
const SUITS = {
  HEARTS: 'hearts',     // 红桃
  SPADES: 'spades',     // 黑桃
  CLUBS: 'clubs',       // 梅花
  DIAMONDS: 'diamonds', // 方块
};

/** 花色中文名 */
const SUIT_NAMES = {
  [SUITS.HEARTS]: '红桃',
  [SUITS.SPADES]: '黑桃',
  [SUITS.CLUBS]: '梅花',
  [SUITS.DIAMONDS]: '方块',
};

/** 花色符号 */
const SUIT_SYMBOLS = {
  [SUITS.HEARTS]: '♥',
  [SUITS.SPADES]: '♠',
  [SUITS.CLUBS]: '♣',
  [SUITS.DIAMONDS]: '♦',
};

/** 牌面值（从大到小） */
const RANKS = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

/** 牌的数值权重（用于比较大小） */
const RANK_VALUES = {
  'BIG_JOKER': 16,
  'SMALL_JOKER': 15,
  'A': 14,
  'K': 13,
  'Q': 12,
  'J': 11,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
};

/** 分值牌 - 带分的牌 */
const SCORE_CARDS = {
  '5': 5,   // 5分
  '10': 10, // 10分
  'K': 10,  // 10分
};

/** 叫分最低值 */
const MIN_BID = 75;

/** 叫分最高值 */
const MAX_BID = 100;

/** 叫分步进 */
const BID_STEP = 5;

/** 每轮分值 */
const ROUND_TOTAL = 100;

/** 每人每轮手牌数 */
const HAND_SIZE = 12;

/** 底牌数 */
const DI_PAI_COUNT = 6;

/** 倍率定义 */
const MULTIPLY_LEVELS = {
  NONE: 0,
  DAO: 2,    // 倒 - 2倍
  LEI: 3,    // 擂 - 3倍
  WO: 4,     // 窝 - 4倍
  ZHUA: 5,   // 抓 - 5倍
};

const MULTIPLY_NAMES = {
  [MULTIPLY_LEVELS.NONE]: '',
  [MULTIPLY_LEVELS.DAO]: '倒',
  [MULTIPLY_LEVELS.LEI]: '擂',
  [MULTIPLY_LEVELS.WO]: '窝',
  [MULTIPLY_LEVELS.ZHUA]: '抓',
};

/** 游戏阶段 */
const PHASE = {
  WAITING: 'waiting',       // 等待玩家
  DEALING: 'dealing',       // 发牌中
  TRUMP_SELECT: 'trump_select', // 选主牌（100分时亮明主牌A）
  BIDDING: 'bidding',       // 叫分
  DI_PAI: 'di_pai',         // 扑底牌（换底牌）
  MULTIPLY: 'multiply',     // 倍率加注
  PLAYING: 'playing',       // 出牌
  ROUND_END: 'round_end',   // 本轮结束/结算
  GAME_OVER: 'game_over',   // 游戏结束
};

/** 队伍 */
const TEAM = {
  ATTACK: 'attack',   // 打牌方（叫分方及对家）
  DEFENSE: 'defense',  // 吃牌方
};

// ==================== 工具函数 ====================

/**
 * 创建一张牌
 */
function createCard(suit, rank, isJoker = false) {
  return {
    id: isJoker ? rank : `${suit}_${rank}`, // 唯一标识
    suit,          // 花色
    rank,          // 牌面
    isJoker,       // 是否为鬼牌
    value: RANK_VALUES[isJoker ? rank : rank], // 权重值
    score: isJoker ? 0 : (SCORE_CARDS[rank] || 0), // 分值
  };
}

/**
 * 创建完整的54张牌
 */
function createDeck() {
  const deck = [];
  // 四门花色各13张
  Object.values(SUITS).forEach(suit => {
    RANKS.forEach(rank => {
      deck.push(createCard(suit, rank));
    });
  });
  // 大小鬼
  deck.push(createCard(null, 'BIG_JOKER', true));
  deck.push(createCard(null, 'SMALL_JOKER', true));
  return deck;
}

/**
 * Fisher-Yates 洗牌算法
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 判断一张牌是否是主牌
 * @param {Object} card - 牌对象
 * @param {string|null} trumpSuit - 主牌花色
 * @returns {boolean}
 */
function isTrump(card, trumpSuit) {
  if (card.isJoker) return true;
  if (!trumpSuit) return false;
  return card.suit === trumpSuit;
}

/**
 * 判断一张牌是否是分牌（5、10、K）
 */
function isScoreCard(card) {
  return !card.isJoker && SCORE_CARDS[card.rank] > 0;
}

/**
 * 获取牌的显示文本
 */
function getCardDisplay(card) {
  if (card.rank === 'BIG_JOKER') return '大鬼';
  if (card.rank === 'SMALL_JOKER') return '小鬼';
  return `${SUIT_SYMBOLS[card.suit] || ''}${card.rank}`;
}

/**
 * 比较两张牌的大小（同主副条件下）
 * 返回 > 0 表示 cardA 大于 cardB
 */
function compareCards(cardA, cardB, trumpSuit) {
  // 大小鬼永远是最大的
  if (cardA.rank === 'BIG_JOKER' && cardB.rank !== 'BIG_JOKER') return 1;
  if (cardA.rank !== 'BIG_JOKER' && cardB.rank === 'BIG_JOKER') return -1;
  if (cardA.rank === 'SMALL_JOKER' && cardB.rank !== 'SMALL_JOKER' && cardB.rank !== 'BIG_JOKER') return 1;
  if (cardA.rank !== 'SMALL_JOKER' && cardA.rank !== 'BIG_JOKER' && cardB.rank === 'SMALL_JOKER') return -1;
  if (cardA.rank === 'BIG_JOKER' && cardB.rank === 'BIG_JOKER') return 0;
  if (cardA.rank === 'SMALL_JOKER' && cardB.rank === 'SMALL_JOKER') return 0;

  // 主牌 > 副牌
  const aTrump = isTrump(cardA, trumpSuit);
  const bTrump = isTrump(cardB, trumpSuit);
  if (aTrump && !bTrump) return 1;
  if (!aTrump && bTrump) return -1;

  // 同为主牌或同为副牌，比大小
  return cardA.value - cardB.value;
}

// ==================== 游戏引擎类 ====================

class YaoziFenEngine {
  constructor() {
    this.reset();
  }

  /**
   * 重置整个游戏状态
   */
  reset() {
    this.phase = PHASE.WAITING;
    this.players = [];       // 4个玩家 [{id, name, avatar, hand:[], isReady}]
    this.trumpSuit = null;   // 当前主牌花色
    this.trumpA = null;      // 主牌A的持有者（用于打100分亮牌）
    this.bids = [];          // 叫分记录 [{playerIndex, score, isHundred}]
    this.currentBidder = 0;  // 当前叫分者索引
    this.maxBid = 0;         // 当前最高叫分
    this.maxBidder = -1;     // 当前最高叫分者
    this.declarer = -1;      // 叫分最高者（庄家）
    this.declarerTeam = TEAM.ATTACK;
    this.defenseTeam = TEAM.DEFENSE;
    this.diPai = [];         // 底牌
    this.currentTrick = [];  // 当前一轮出的牌 [{playerIndex, card}]
    this.trickLeader = -1;   // 本轮首家出牌者
    this.currentPlayer = -1; // 当前出牌者
    this.trickCount = 0;     // 已完成的轮数
    this.attackScore = 0;    // 打牌方吃到的分
    this.defenseScore = 0;   // 吃牌方吃到的分
    this.attackCards = [];   // 打牌方吃到的牌
    this.defenseCards = [];  // 吃牌方吃到的牌
    this.multiply = { attack: MULTIPLY_LEVELS.NONE, defense: MULTIPLY_LEVELS.NONE };
    this.baseCups = 1;       // 底酒杯数
    this.roundHistory = [];  // 历史轮记录
    this.firstBidder = 0;    // 第一轮叫分的人（逆时针轮换）
    this.roundNumber = 0;    // 当前局数
    this.isHundredBid = false; // 是否100分叫
    this.hundredTrumpCard = null; // 100分时亮明的主牌A
    this.winner = null;      // 本轮赢家
    this.penalties = [];     // 罚牌记录
  }

  // ==================== 玩家管理 ====================

  /**
   * 初始化4个玩家
   * @param {Array} playerList - [{id, name, avatar}]
   * @param {number} localPlayerIndex - 本地玩家座位索引
   */
  initPlayers(playerList, localPlayerIndex = 0) {
    this.players = playerList.map((p, i) => ({
      ...p,
      seatIndex: i,
      hand: [],
      isReady: false,
      team: (i % 2 === 0) ? TEAM.ATTACK : TEAM.DEFENSE,
    }));
    // 默认队伍分配：0,2 vs 1,3
    this.players[0].team = TEAM.ATTACK;
    this.players[1].team = TEAM.DEFENSE;
    this.players[2].team = TEAM.ATTACK;
    this.players[3].team = TEAM.DEFENSE;
  }

  /**
   * 获取玩家（按逆时针顺序的索引）
   * 逆时针：0 -> 3 -> 2 -> 1 -> 0
   */
  getNextPlayerIndex(currentIndex) {
    return (currentIndex + 3) % 4; // 逆时针
  }

  // ==================== 发牌 ====================

  /**
   * 发牌：洗牌 -> 每人12张 + 6张底牌
   */
  dealCards(firstPlayerIndex = 0) {
    const deck = shuffle(createDeck());
    this.firstBidder = firstPlayerIndex;

    // 每人12张，按逆时针顺序发牌
    this.players.forEach((player, i) => {
      const startIdx = i * HAND_SIZE;
      player.hand = deck.slice(startIdx, startIdx + HAND_SIZE);
      // 手牌按大小排序（方便出牌时展示）
      player.hand.sort((a, b) => b.value - a.value);
    });

    // 剩余6张为底牌
    this.diPai = deck.slice(48, 54);

    this.phase = PHASE.BIDDING;
    this.currentBidder = firstPlayerIndex;
    this.maxBid = 0;
    this.maxBidder = -1;
    this.bids = [];
    this.trickCount = 0;
    this.attackScore = 0;
    this.defenseScore = 0;
    this.attackCards = [];
    this.defenseCards = [];
    this.winner = null;
    this.isHundredBid = false;
    this.multiply = { attack: MULTIPLY_LEVELS.NONE, defense: MULTIPLY_LEVELS.NONE };
    this.currentTrick = [];

    return {
      hands: this.players.map(p => p.hand),
      diPai: this.diPai,
      firstBidder: this.firstBidder,
    };
  }

  // ==================== 叫分 ====================

  /**
   * 开始叫分
   * @returns {Object} 叫分状态
   */
  startBidding() {
    this.phase = PHASE.BIDDING;
    this.currentBidder = this.firstBidder;
    this.maxBid = 0;
    this.maxBidder = -1;
    this.bids = [];
    return {
      currentBidder: this.currentBidder,
      minBid: MIN_BID,
      maxBid: MAX_BID,
    };
  }

  /**
   * 玩家叫分
   * @param {number} playerIndex - 叫分玩家索引
   * @param {number} score - 叫的分数（0表示不加/不叫）
   * @param {boolean} isHundred - 是否打100分
   */
  placeBid(playerIndex, score, isHundred = false) {
    if (this.phase !== PHASE.BIDDING) {
      return { success: false, message: '当前不在叫分阶段' };
    }
    if (playerIndex !== this.currentBidder) {
      return { success: false, message: '还没轮到你叫分' };
    }

    // 检查叫分合法性
    if (isHundred) {
      // 打100分：必须持有主牌A（叫分时还未确定主牌，改为叫分时同时声明主牌花色）
      // 回头分（第二次叫分）才能打100分，简化处理：第一轮叫分不能直接叫100
      if (this.bids.length < 4) {
        // 非回头分，不允许直接100
        return { success: false, message: '回头分才能打100分' };
      }
      // 检查是否持有对应花色A（叫100时需同时声明主牌花色）
    }

    if (score > 0) {
      if (score < MIN_BID || score > MAX_BID) {
        return { success: false, message: `叫分范围为${MIN_BID}-${MAX_BID}` };
      }
      if (score % BID_STEP !== 0) {
        return { success: false, message: `叫分必须是${BID_STEP}的倍数` };
      }
      if (score <= this.maxBid && !isHundred) {
        return { success: false, message: `叫分必须超过当前最高分${this.maxBid}` };
      }
    }

    this.bids.push({
      playerIndex,
      score,
      isHundred,
      timestamp: Date.now(),
    });

    if (score > this.maxBid || isHundred) {
      this.maxBid = isHundred ? 100 : score;
      this.maxBidder = playerIndex;
      this.isHundredBid = isHundred;
    }

    // 移到下一个叫分者（逆时针）
    this.currentBidder = this.getNextPlayerIndex(playerIndex);

    // 检查叫分是否结束：4人都叫过
    const biddingComplete = this.bids.length >= 4;

    if (biddingComplete) {
      if (this.maxBidder === -1) {
        // 没人叫分，重新发牌
        this.phase = PHASE.DEALING;
        return { success: true, bidComplete: true, noBid: true };
      }
      // 确定庄家
      this.declarer = this.maxBidder;
      this.declarerTeam = this.players[this.declarer].team;
      this.defenseTeam = this.declarerTeam === TEAM.ATTACK ? TEAM.DEFENSE : TEAM.ATTACK;
      this.phase = PHASE.TRUMP_SELECT;

      return {
        success: true,
        bidComplete: true,
        noBid: false,
        declarer: this.declarer,
        bidScore: this.maxBid,
        isHundred: this.isHundredBid,
        bids: this.bids,
      };
    }

    return {
      success: true,
      bidComplete: false,
      currentBidder: this.currentBidder,
      maxBid: this.maxBid,
    };
  }

  // ==================== 主牌选择与底牌 ====================

  /**
   * 确定主牌花色
   * @param {string} suit - 主牌花色
   * @param {Object} hundredCard - 100分时的主牌A卡牌对象
   */
  setTrumpSuit(suit, hundredCard = null) {
    this.trumpSuit = suit;
    this.hundredTrumpCard = hundredCard;
    this.phase = PHASE.DI_PAI;

    // 打100分时，需要记录谁亮了主牌A
    if (this.isHundredBid && hundredCard) {
      this.players.forEach((p, i) => {
        const idx = p.hand.findIndex(c => c.id === hundredCard.id);
        if (idx !== -1) {
          this.trumpA = i;
        }
      });
    }

    return {
      trumpSuit: suit,
      trumpName: SUIT_NAMES[suit] || '无',
      phase: PHASE.DI_PAI,
    };
  }

  /**
   * 扑底牌（庄家换底牌）
   * @param {number} playerIndex - 庄家索引
   * @param {Array} discardedCards - 要打到底牌的手牌ID数组
   * @returns {Object} 换牌结果
   */
  swapDiPai(playerIndex, discardedCards) {
    if (this.phase !== PHASE.DI_PAI) {
      return { success: false, message: '当前不在扑底牌阶段' };
    }
    if (playerIndex !== this.declarer) {
      return { success: false, message: '只有庄家可以扑底牌' };
    }

    // 检查不能扑分牌
    const hand = this.players[playerIndex].hand;
    const discarded = discardedCards.map(id => hand.find(c => c.id === id));

    const hasScoreCard = discarded.some(c => c && isScoreCard(c));
    if (hasScoreCard) {
      return { success: false, message: '扑底牌不能扑分牌' };
    }

    if (discarded.length !== DI_PAI_COUNT) {
      return { success: false, message: `必须选择${DI_PAI_COUNT}张底牌` };
    }

    // 从手牌中移除选中的牌
    const discardIds = new Set(discardedCards);
    this.players[playerIndex].hand = hand.filter(c => !discardIds.has(c.id));

    // 底牌加入手牌
    this.players[playerIndex].hand.push(...this.diPai);
    this.players[playerIndex].hand.sort((a, b) => b.value - a.value);

    // 更新底牌为被替换的牌
    this.diPai = discarded;

    // 进入倍率阶段
    this.phase = PHASE.MULTIPLY;

    return {
      success: true,
      newHand: this.players[playerIndex].hand,
      newDiPai: this.diPai,
    };
  }

  // ==================== 倍率 ====================

  /**
   * 加倍（吃牌方先加，打牌方可反制）
   * @param {number} playerIndex - 操作玩家
   * @param {number} level - 加倍等级 (0=不加, 2=倒, 3=擂, 4=窝, 5=抓)
   */
  placeMultiply(playerIndex, level) {
    if (this.phase !== PHASE.MULTIPLY) {
      return { success: false, message: '当前不在加倍阶段' };
    }

    const team = this.players[playerIndex].team;

    if (team === this.defenseTeam) {
      // 吃牌方加倍
      this.multiply.defense = level;
    } else {
      // 打牌方反制
      if (level <= this.multiply.defense && this.multiply.defense > 0) {
        return { success: false, message: '反制倍率必须高于对方' };
      }
      this.multiply.attack = level;
    }

    // 简化处理：双方都选择后进入出牌
    // 实际中可以轮流加倍
    return { success: true, multiply: { ...this.multiply } };
  }

  /**
   * 结束加倍阶段，开始出牌
   */
  startPlaying() {
    this.phase = PHASE.PLAYING;
    this.trickLeader = this.declarer;
    this.currentPlayer = this.declarer;
    this.trickCount = 0;
    this.currentTrick = [];
    return {
      phase: PHASE.PLAYING,
      trickLeader: this.trickLeader,
      currentPlayer: this.currentPlayer,
    };
  }

  // ==================== 出牌逻辑 ====================

  /**
   * 出牌
   * @param {number} playerIndex - 出牌者
   * @param {string} cardId - 出的牌的ID
   */
  playCard(playerIndex, cardId) {
    if (this.phase !== PHASE.PLAYING) {
      return { success: false, message: '当前不在出牌阶段' };
    }
    if (playerIndex !== this.currentPlayer) {
      return { success: false, message: '还没轮到你出牌' };
    }

    const player = this.players[playerIndex];
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      return { success: false, message: '你手里没有这张牌' };
    }

    const card = player.hand[cardIndex];

    // 验证出牌规则
    if (this.currentTrick.length > 0) {
      const leadCard = this.currentTrick[0].card;
      const leadIsTrump = isTrump(leadCard, this.trumpSuit);
      const cardIsTrump = isTrump(card, this.trumpSuit);

      if (leadIsTrump) {
        // 出主牌随主牌
        if (!cardIsTrump) {
          // 检查是否还有主牌
          const hasTrump = player.hand.some(c => isTrump(c, this.trumpSuit));
          if (hasTrump) {
            return { success: false, message: '有主牌必须跟主牌' };
          }
          // 无主牌可以垫牌
        }
      } else {
        // 出副牌随副牌
        const leadSuit = leadCard.suit;
        const sameSuit = player.hand.some(c => !c.isJoker && c.suit === leadSuit);
        if (sameSuit && card.suit !== leadSuit) {
          return { success: false, message: `有${SUIT_NAMES[leadSuit]}必须跟${SUIT_NAMES[leadSuit]}` };
        }
        // 无同色牌可以垫牌（可以出主牌杀或垫其他副牌）
      }
    }

    // 从手牌中移除
    player.hand.splice(cardIndex, 1);

    // 添加到当前轮
    this.currentTrick.push({
      playerIndex,
      card,
    });

    // 检查本轮是否结束（4张牌出完）
    if (this.currentTrick.length === 4) {
      return this.resolveTrick();
    }

    // 下一个出牌者（逆时针）
    this.currentPlayer = this.getNextPlayerIndex(playerIndex);

    return {
      success: true,
      trickComplete: false,
      currentPlayer: this.currentPlayer,
      currentTrick: this.currentTrick,
    };
  }

  /**
   * 结算一轮（4张牌出完），判断谁最大
   */
  resolveTrick() {
    const leadCard = this.currentTrick[0].card;
    let winIndex = 0;
    let maxCard = leadCard;

    for (let i = 1; i < 4; i++) {
      const { card } = this.currentTrick[i];
      const cmp = compareCards(card, maxCard, this.trumpSuit);
      if (cmp > 0) {
        winIndex = i;
        maxCard = card;
      }
    }

    const winnerPlayerIndex = this.currentTrick[winIndex].playerIndex;
    const winnerTeam = this.players[winnerPlayerIndex].team;

    // 计算本轮分值
    let trickScore = 0;
    const trickCards = [];
    this.currentTrick.forEach(({ card }) => {
      trickScore += card.score;
      trickCards.push(card);
    });

    // 计入对应队伍
    if (winnerTeam === this.declarerTeam) {
      this.attackScore += trickScore;
      this.attackCards.push(...trickCards);
    } else {
      this.defenseScore += trickScore;
      this.defenseCards.push(...trickCards);
    }

    this.trickCount++;

    const record = {
      trickNumber: this.trickCount,
      cards: [...this.currentTrick],
      winner: winnerPlayerIndex,
      winnerTeam,
      score: trickScore,
      attackTotal: this.attackScore,
      defenseTotal: this.defenseScore,
    };
    this.roundHistory.push(record);

    // 重置当前轮
    this.currentTrick = [];

    // 检查游戏是否结束（12轮出完）
    if (this.trickCount >= 12) {
      this.phase = PHASE.ROUND_END;
      return {
        success: true,
        trickComplete: true,
        trickResult: record,
        gameOver: true,
        finalResult: this.calculateResult(),
      };
    }

    // 赢家出下一轮
    this.trickLeader = winnerPlayerIndex;
    this.currentPlayer = winnerPlayerIndex;

    return {
      success: true,
      trickComplete: true,
      trickResult: record,
      gameOver: false,
      currentPlayer: this.currentPlayer,
      trickLeader: this.trickLeader,
      attackScore: this.attackScore,
      defenseScore: this.defenseScore,
    };
  }

  // ==================== 结算 ====================

  /**
   * 计算最终结果
   */
  calculateResult() {
    const bidScore = this.maxBid;
    const attackScore = this.attackScore;
    const defenseScore = this.defenseScore;

    // 吃牌方需吃够的分
    const defenseNeeded = ROUND_TOTAL - bidScore + 5;

    let result;

    if (attackScore >= bidScore) {
      // 打牌方赢（吃够叫分）
      result = {
        winnerTeam: this.declarerTeam,
        winnerLabel: '打牌方',
        isAttackWin: true,
        isDefenseWin: false,
        isDraw: false,
        isGuangtou: false,
        bidScore,
        attackScore,
        defenseScore,
        defenseNeeded,
        description: `打牌方吃够${bidScore}分，获胜！`,
      };
    } else if (defenseScore >= defenseNeeded) {
      // 吃牌方赢（吃够了）
      result = {
        winnerTeam: this.defenseTeam,
        winnerLabel: '吃牌方',
        isAttackWin: false,
        isDefenseWin: true,
        isDraw: false,
        isGuangtou: false,
        bidScore,
        attackScore,
        defenseScore,
        defenseNeeded,
        description: `吃牌方吃够${defenseNeeded}分，获胜！`,
      };
    } else if (defenseScore === ROUND_TOTAL - bidScore) {
      // 平牌（吃牌方正好吃了100-叫分，算输）
      result = {
        winnerTeam: this.declarerTeam,
        winnerLabel: '打牌方',
        isAttackWin: true,
        isDefenseWin: false,
        isDraw: false,
        isGuangtou: false,
        bidScore,
        attackScore,
        defenseScore,
        defenseNeeded,
        description: `吃牌方吃了${defenseScore}分，刚好平牌，算打牌方赢`,
      };
    } else {
      // 打牌方没吃够，吃牌方也没吃够 -> 打牌方输
      result = {
        winnerTeam: this.defenseTeam,
        winnerLabel: '吃牌方',
        isAttackWin: false,
        isDefenseWin: true,
        isDraw: false,
        isGuangtou: false,
        bidScore,
        attackScore,
        defenseScore,
        defenseNeeded,
        description: `打牌方未吃够${bidScore}分，吃牌方获胜！`,
      };
    }

    // 检查光头
    if (attackScore === 0) {
      result.isGuangtou = true;
      result.description += '（光头！大败！）';
    }

    // 计算倍率和酒杯
    const effectiveMultiply = Math.max(this.multiply.defense, this.multiply.attack) || 1;
    result.baseCups = this.baseCups;
    result.effectiveMultiply = effectiveMultiply;

    if (result.isGuangtou) {
      // 光头：底酒3杯/人
      result.loserCups = this.baseCups * 3;
      result.multiplyName = '光头';
    } else {
      // 正常输赢
      result.loserCups = this.baseCups * effectiveMultiply;
      result.multiplyName = MULTIPLY_NAMES[effectiveMultiply] || '';
    }

    this.winner = result;
    this.phase = PHASE.ROUND_END;

    return result;
  }

  /**
   * 获取有效的叫分选项
   */
  getBidOptions() {
    const options = [];
    if (this.maxBid === 0) {
      options.push(0); // 不叫
      for (let s = MIN_BID; s <= MAX_BID; s += BID_STEP) {
        options.push(s);
      }
    } else if (this.bids.length >= 4 && this.maxBid < MAX_BID) {
      // 回头分，可以打100
      options.push(0);
      if (this.players[this.currentBidder].hand.some(c => c.rank === 'A')) {
        options.push(100); // 有A才能打100
      }
      for (let s = this.maxBid + BID_STEP; s <= MAX_BID; s += BID_STEP) {
        options.push(s);
      }
    } else {
      options.push(0);
      for (let s = this.maxBid + BID_STEP; s <= MAX_BID; s += BID_STEP) {
        options.push(s);
      }
    }
    return options;
  }

  /**
   * 获取某个玩家可以出哪些牌
   */
  getPlayableCards(playerIndex) {
    const player = this.players[playerIndex];
    if (!player || player.hand.length === 0) return [];

    // 首家出牌，任何牌都可以出
    if (this.currentTrick.length === 0) {
      return player.hand.map(c => c.id);
    }

    const leadCard = this.currentTrick[0].card;
    const leadIsTrump = isTrump(leadCard, this.trumpSuit);
    const leadSuit = leadCard.suit;

    if (leadIsTrump) {
      // 主牌 -> 必须跟主牌，没有则垫任意牌
      const trumpCards = player.hand.filter(c => isTrump(c, this.trumpSuit));
      if (trumpCards.length > 0) {
        return trumpCards.map(c => c.id);
      }
      return player.hand.map(c => c.id); // 垫牌
    } else {
      // 副牌 -> 必须跟同花色，没有则垫任意牌
      const sameSuitCards = player.hand.filter(c => !c.isJoker && c.suit === leadSuit);
      if (sameSuitCards.length > 0) {
        return sameSuitCards.map(c => c.id);
      }
      return player.hand.map(c => c.id); // 垫牌
    }
  }

  /**
   * 获取游戏完整状态（用于同步）
   */
  getState() {
    return {
      phase: this.phase,
      trumpSuit: this.trumpSuit,
      trumpName: this.trumpSuit ? SUIT_NAMES[this.trumpSuit] : null,
      currentBidder: this.currentBidder,
      maxBid: this.maxBid,
      maxBidder: this.maxBidder,
      declarer: this.declarer,
      declarerTeam: this.declarerTeam,
      defenseTeam: this.defenseTeam,
      currentPlayer: this.currentPlayer,
      trickLeader: this.trickLeader,
      currentTrick: this.currentTrick,
      trickCount: this.trickCount,
      attackScore: this.attackScore,
      defenseScore: this.defenseScore,
      multiply: this.multiply,
      bidOptions: this.getBidOptions(),
      roundNumber: this.roundNumber,
      roundHistory: this.roundHistory,
      winner: this.winner,
      diPaiCount: this.diPai.length,
      isHundredBid: this.isHundredBid,
      playerTeams: this.players.map(p => ({ id: p.id, team: p.team })),
      handSizes: this.players.map(p => p.hand.length),
    };
  }

  /**
   * 获取玩家可见的手牌信息
   * @param {number} viewerIndex - 查看者索引
   */
  getVisibleHands(viewerIndex) {
    return this.players.map((p, i) => {
      if (i === viewerIndex) {
        return { playerIndex: i, cards: p.hand };
      }
      return { playerIndex: i, cardCount: p.hand.length, cards: null };
    });
  }
}

// ==================== 导出 ====================

module.exports = {
  YaoziFenEngine,
  SUITS,
  SUIT_NAMES,
  SUIT_SYMBOLS,
  RANKS,
  RANK_VALUES,
  SCORE_CARDS,
  PHASE,
  TEAM,
  MULTIPLY_LEVELS,
  MULTIPLY_NAMES,
  MIN_BID,
  MAX_BID,
  BID_STEP,
  ROUND_TOTAL,
  HAND_SIZE,
  DI_PAI_COUNT,
  createDeck,
  shuffle,
  isTrump,
  isScoreCard,
  getCardDisplay,
  compareCards,
  createCard,
};
