/**
 * 腾冲幺子分 - AI玩家逻辑
 * 提供简单AI对手，用于单人练习模式
 */

const {
  isTrump, isScoreCard, compareCards, SUITS, RANK_VALUES,
  MULTIPLY_LEVELS, MIN_BID, PHASE,
} = require('./game-engine');

class AIPlayer {
  constructor(difficulty = 'normal') {
    this.difficulty = difficulty; // easy, normal, hard
  }

  /**
   * AI叫分决策
   * @param {Array} hand - AI手牌
   * @param {number} currentMaxBid - 当前最高叫分
   * @param {Array} bids - 已有叫分记录
   * @returns {number} 叫分分数（0=不加）
   */
  decideBid(hand, currentMaxBid, bids) {
    const strength = this.evaluateHandStrength(hand);

    // 简单难度：很少叫高分
    if (this.difficulty === 'easy') {
      if (strength > 80 && currentMaxBid <= 75) return 75;
      return 0;
    }

    // 普通/困难难度
    const trumpCount = hand.filter(c => c.isJoker).length;
    const scoreCount = hand.filter(c => isScoreCard(c)).length;
    const highCards = hand.filter(c => c.value >= 13).length;

    let desireScore = 0;

    if (strength > 90 && trumpCount >= 2) {
      desireScore = 95;
    } else if (strength > 80 && highCards >= 5) {
      desireScore = 85;
    } else if (strength > 65 && highCards >= 4) {
      desireScore = 80;
    } else if (strength > 50 && scoreCount >= 4) {
      desireScore = 75;
    }

    if (desireScore <= currentMaxBid) return 0;

    // 按5的倍数向上取
    desireScore = Math.ceil(desireScore / 5) * 5;
    if (desireScore > 100) desireScore = 100;

    // 困难难度更激进
    if (this.difficulty === 'hard' && desireScore > currentMaxBid + 10) {
      desireScore = Math.min(desireScore + 10, 100);
    }

    return desireScore;
  }

  /**
   * 评估手牌强度
   */
  evaluateHandStrength(hand) {
    let score = 0;

    hand.forEach(card => {
      if (card.isJoker) score += 15;
      else if (card.value >= 14) score += 8;  // A
      else if (card.value >= 12) score += 5;  // Q, K
      else if (card.value >= 10) score += 3;  // J, 10
      else if (isScoreCard(card)) score += 4; // 5
    });

    return Math.min(100, score);
  }

  /**
   * AI加倍决策
   * @param {Array} hand - AI手牌
   * @param {string} team - AI所在队伍
   * @param {Object} currentMultiply - 当前倍率
   * @returns {number} 倍率等级
   */
  decideMultiply(hand, team, currentMultiply) {
    const strength = this.evaluateHandStrength(hand);

    if (team === 'defense') {
      // 吃牌方：牌好就加倍
      if (strength > 75 && this.difficulty !== 'easy') {
        return strength > 85 ? MULTIPLY_LEVELS.WO : MULTIPLY_LEVELS.DAO;
      }
    } else {
      // 打牌方：只有对方加倍时才考虑反制
      if (currentMultiply.defense > 0) {
        if (strength > 80 && this.difficulty === 'hard') {
          return Math.min(currentMultiply.defense + 1, MULTIPLY_LEVELS.ZHUA);
        }
      }
    }

    return MULTIPLY_LEVELS.NONE;
  }

  /**
   * AI出牌决策
   * @param {Array} hand - AI手牌
   * @param {Array} currentTrick - 当前轮已出的牌
   * @param {string} trumpSuit - 主牌花色
   * @param {number} playerIndex - AI座位
   * @param {Array} players - 所有玩家信息
   * @param {Object} gameState - 游戏状态
   * @returns {string} 要出的牌ID
   */
  decidePlay(hand, currentTrick, trumpSuit, playerIndex, players, gameState) {
    const playable = this.getPlayableCards(hand, currentTrick, trumpSuit);
    if (playable.length === 0) return null;
    if (playable.length === 1) return playable[0].id;

    const isLeading = currentTrick.length === 0;

    if (isLeading) {
      return this.decideLead(playable, hand, trumpSuit, gameState);
    } else {
      return this.decideFollow(playable, hand, currentTrick, trumpSuit, playerIndex, gameState);
    }
  }

  /**
   * 首家出牌策略
   */
  decideLead(playable, hand, trumpSuit, gameState) {
    // 优先出副牌大牌清分牌，或者出主牌逼对方

    if (this.difficulty === 'easy') {
      // 简单：随机出
      return playable[Math.floor(Math.random() * playable.length)].id;
    }

    // 困难：更聪明的出牌
    if (this.difficulty === 'hard') {
      // 先出副牌大牌（A、K）试探
      const bigSideCards = playable.filter(c => !isTrump(c, trumpSuit) && c.value >= 13);
      if (bigSideCards.length > 0) {
        return bigSideCards[0].id; // 最大的副牌
      }
    }

    // 普通：先出分牌少的副牌
    const sideCards = playable.filter(c => !isTrump(c, trumpSuit) && !isScoreCard(c));
    if (sideCards.length > 0) {
      return sideCards[0].id;
    }

    // 出最小的主牌
    const sorted = [...playable].sort((a, b) => a.value - b.value);
    return sorted[0].id;
  }

  /**
   * 跟牌策略
   */
  decideFollow(playable, hand, currentTrick, trumpSuit, playerIndex, gameState) {
    const leadCard = currentTrick[0].card;
    const leadIsTrump = isTrump(leadCard, trumpSuit);

    // 找当前轮最大的牌
    let currentMax = leadCard;
    let currentMaxPlayer = currentTrick[0].playerIndex;
    currentTrick.forEach(({ card, playerIndex: pi }) => {
      if (compareCards(card, currentMax, trumpSuit) > 0) {
        currentMax = card;
        currentMaxPlayer = pi;
      }
    });

    // 判断对家是否在赢
    const partnerIndex = (playerIndex + 2) % 4;
    const partnerIsWinning = currentMaxPlayer === partnerIndex;

    if (partnerIsWinning) {
      // 对家在赢：出小牌不浪费
      const sorted = [...playable].sort((a, b) => a.value - b.value);
      return sorted[0].id;
    }

    // 对家不在赢：尝试赢牌
    const canWin = playable.filter(c => compareCards(c, currentMax, trumpSuit) > 0);

    if (canWin.length > 0) {
      // 能赢就赢，出最小的能赢的牌
      const sorted = [...canWin].sort((a, b) => a.value - b.value);

      // 如果是困难模式且有分牌在场上，优先用大牌赢
      if (this.difficulty === 'hard') {
        const trickScore = currentTrick.reduce((sum, { card }) => sum + card.score, 0);
        if (trickScore >= 10) {
          return sorted[0].id; // 有分牌，认真赢
        }
      }

      // 普通策略：如果只剩一轮出牌且分不多，可考虑不赢
      if (this.difficulty === 'easy' && Math.random() > 0.5) {
        const sortedAll = [...playable].sort((a, b) => a.value - b.value);
        return sortedAll[0].id;
      }

      return sorted[0].id;
    }

    // 赢不了，出最小的牌
    const sorted = [...playable].sort((a, b) => a.value - b.value);
    return sorted[0].id;
  }

  /**
   * 获取可出的牌
   */
  getPlayableCards(hand, currentTrick, trumpSuit) {
    if (currentTrick.length === 0) {
      return hand;
    }

    const leadCard = currentTrick[0].card;
    const leadIsTrump = isTrump(leadCard, trumpSuit);
    const leadSuit = leadCard.suit;

    if (leadIsTrump) {
      const trumpCards = hand.filter(c => isTrump(c, trumpSuit));
      return trumpCards.length > 0 ? trumpCards : hand;
    } else {
      const sameSuit = hand.filter(c => !c.isJoker && c.suit === leadSuit);
      return sameSuit.length > 0 ? sameSuit : hand;
    }
  }

  /**
   * AI扑底牌决策
   * @param {Array} hand - 手牌
   * @param {Array} diPai - 底牌
   * @param {string} trumpSuit - 主牌花色
   * @returns {Array} 要打到底牌的6张牌ID
   */
  decideDiPai(hand, diPai, trumpSuit) {
    // 策略：保留分牌和主牌大牌，打出最小的非分牌
    const nonScoreCards = hand.filter(c => !isScoreCard(c));
    const sorted = [...nonScoreCards].sort((a, b) => a.value - b.value);

    // 优先打出非主牌小牌
    const sideCards = sorted.filter(c => !isTrump(c, trumpSuit));
    const discardable = sideCards.length >= 6 ? sideCards : sorted;

    return discardable.slice(0, 6).map(c => c.id);
  }
}

module.exports = AIPlayer;
