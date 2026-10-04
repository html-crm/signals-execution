import type {
  NewsEvent,
  NewsAssetMapping,
  NewsCategory,
  NewsSentiment,
  NewsImpactLevel,
  NewsSourceType,
  SignalDirection,
} from '@types';

export interface ImpactScoreFactors {
  sourceCredibility: number;
  relevanceToAsset: number;
  magnitude: number;
  freshness: number;
  marketReaction: number;
  historicalSignificance: number;
  confirmationLevel: number;
  multipleSources: number;
}

export interface ImpactScoreResult {
  overallScore: number;
  impactLevel: NewsImpactLevel;
  direction: SignalDirection;
  confidence: number;
  factors: ImpactScoreFactors;
  breakdown: {
    factor: string;
    weight: number;
    score: number;
    contribution: number;
  }[];
}

export class NewsImpactScorer {
  private readonly weights = {
    sourceCredibility: 0.20,
    relevanceToAsset: 0.20,
    magnitude: 0.15,
    freshness: 0.10,
    marketReaction: 0.15,
    historicalSignificance: 0.10,
    confirmationLevel: 0.05,
    multipleSources: 0.05,
  };

  private readonly sourceCredibilityMap: Record<NewsSourceType, number> = {
    OFFICIAL_BLOG: 95,
    REGULATORY_FILING: 95,
    EXCHANGE_ANNOUNCEMENT: 90,
    API: 85,
    RSS: 75,
    ON_CHAIN: 80,
    WHALE_ALERT: 70,
    TWITTER: 50,
    TELEGRAM: 45,
    DISCORD: 40,
    REDDIT: 40,
    YOUTUBE: 35,
    MANUAL: 60,
  };

  private readonly categoryBaseImpact: Record<NewsCategory, number> = {
    REGULATORY: 85,
    ETF: 90,
    EXCHANGE_LISTING: 75,
    EXCHANGE_DELISTING: 80,
    PARTNERSHIP: 60,
    PROTOCOL_UPGRADE: 70,
    TOKEN_UNLOCK: 65,
    HACK_EXPLOIT: 95,
    SECURITY_INCIDENT: 90,
    WHALE_ACTIVITY: 55,
    MACRO_ECONOMIC: 70,
    FED_DECISION: 80,
    CPI_DATA: 75,
    EMPLOYMENT_DATA: 70,
    EARNINGS: 50,
    CORPORATE_ADOPTION: 75,
    GOVERNANCE: 55,
    AIRDROP: 40,
    BURN: 45,
    STAKING: 45,
    DEFI_LAUNCH: 50,
    NFT: 35,
    MEME_COIN: 30,
    LAYER2: 55,
    INFRASTRUCTURE: 50,
    OTHER: 40,
  };

  private readonly sentimentDirectionMap: Record<NewsSentiment, SignalDirection> = {
    VERY_BEARISH: 'SHORT',
    BEARISH: 'SELL',
    NEUTRAL: 'HOLD',
    BULLISH: 'BUY',
    VERY_BULLISH: 'LONG',
  };

  calculateImpact(newsEvent: NewsEvent): ImpactScoreResult {
    const factors = this.calculateFactors(newsEvent);
    const overallScore = this.calculateWeightedScore(factors);
    const impactLevel = this.scoreToImpactLevel(overallScore);
    const direction = this.determineDirection(newsEvent, factors);
    const confidence = this.calculateConfidence(factors, newsEvent);

    return {
      overallScore,
      impactLevel,
      direction,
      confidence,
      factors,
      breakdown: this.createBreakdown(factors),
    };
  }

  private calculateFactors(newsEvent: NewsEvent): ImpactScoreFactors {
    return {
      sourceCredibility: this.scoreSourceCredibility(newsEvent.sourceType, newsEvent.sourceName),
      relevanceToAsset: this.scoreRelevanceToAsset(newsEvent),
      magnitude: this.scoreMagnitude(newsEvent),
      freshness: this.scoreFreshness(newsEvent),
      marketReaction: this.scoreMarketReaction(newsEvent),
      historicalSignificance: this.scoreHistoricalSignificance(newsEvent),
      confirmationLevel: this.scoreConfirmationLevel(newsEvent),
      multipleSources: this.scoreMultipleSources(newsEvent),
    };
  }

  private scoreSourceCredibility(sourceType: NewsSourceType, sourceName: string): number {
    const baseScore = this.sourceCredibilityMap[sourceType] || 50;
    
    const premiumSources = ['coindesk', 'cointelegraph', 'theblock', 'bloomberg', 'reuters', 'wsj', 'ft'];
    const isPremium = premiumSources.some(s => sourceName.toLowerCase().includes(s.toLowerCase()));
    
    return Math.min(100, baseScore + (isPremium ? 10 : 0));
  }

  private scoreRelevanceToAsset(newsEvent: NewsEvent): number {
    if (!newsEvent.affectedAssets || newsEvent.affectedAssets.length === 0) {
      return 50;
    }

    const primaryMapping = newsEvent.affectedAssets.find(a => a.asset === newsEvent.primaryAsset);
    if (primaryMapping) {
      return primaryMapping.relevanceScore;
    }

    const maxRelevance = Math.max(...newsEvent.affectedAssets.map(a => a.relevanceScore));
    return maxRelevance;
  }

  private scoreMagnitude(newsEvent: NewsEvent): number {
    const baseImpact = this.categoryBaseImpact[newsEvent.category] || 50;
    
    let magnitude = baseImpact;
    
    if (newsEvent.keywords.includes('major') || newsEvent.keywords.includes('massive') || 
        newsEvent.keywords.includes('record') || newsEvent.keywords.includes('unprecedented')) {
      magnitude += 15;
    }
    
    if (newsEvent.keywords.includes('breaking') || newsEvent.keywords.includes('urgent')) {
      magnitude += 10;
    }

    return Math.min(100, magnitude);
  }

  private scoreFreshness(newsEvent: NewsEvent): number {
    const ageMinutes = (Date.now() - newsEvent.publishedAt.getTime()) / (1000 * 60);
    
    if (ageMinutes < 5) return 100;
    if (ageMinutes < 15) return 95;
    if (ageMinutes < 60) return 85;
    if (ageMinutes < 360) return 70; // 6 hours
    if (ageMinutes < 1440) return 50; // 24 hours
    if (ageMinutes < 4320) return 30; // 3 days
    return 15;
  }

  private scoreMarketReaction(newsEvent: NewsEvent): number {
    const reaction = newsEvent.marketReaction;
    let score = 50;

    if (reaction.priceChange1h !== undefined) {
      const absChange = Math.abs(reaction.priceChange1h);
      if (absChange > 5) score += 25;
      else if (absChange > 2) score += 15;
      else if (absChange > 1) score += 10;
      else if (absChange > 0.5) score += 5;
    }

    if (reaction.volumeChange1h !== undefined && reaction.volumeChange1h > 50) {
      score += 15;
    }

    if (reaction.oiChange1h !== undefined && Math.abs(reaction.oiChange1h) > 20) {
      score += 10;
    }

    if (reaction.liquidationsLong && reaction.liquidationsLong > 1000000) {
      score += 10;
    }

    return Math.min(100, score);
  }

  private scoreHistoricalSignificance(newsEvent: NewsEvent): number {
    const categoryBase = this.categoryBaseImpact[newsEvent.category] || 50;
    
    const significantCategories: NewsCategory[] = [
      'REGULATORY', 'ETF', 'FED_DECISION', 'HACK_EXPLOIT', 
      'EXCHANGE_DELISTING', 'CORPORATE_ADOPTION', 'GOVERNMENT_POLICY'
    ];
    
    if (significantCategories.includes(newsEvent.category)) {
      return Math.min(100, categoryBase + 20);
    }
    
    return categoryBase;
  }

  private scoreConfirmationLevel(newsEvent: NewsEvent): number {
    let score = 50;
    
    if (newsEvent.isVerified) score += 30;
    
    if (newsEvent.verificationSources && newsEvent.verificationSources.length > 0) {
      score += Math.min(20, newsEvent.verificationSources.length * 5);
    }
    
    if (newsEvent.sourceType === 'OFFICIAL_BLOG' || newsEvent.sourceType === 'REGULATORY_FILING') {
      score += 20;
    }
    
    return Math.min(100, score);
  }

  private scoreMultipleSources(newsEvent: NewsEvent): number {
    const relatedCount = newsEvent.relatedEventIds?.length || 0;
    return Math.min(100, relatedCount * 15 + 20);
  }

  private calculateWeightedScore(factors: ImpactScoreFactors): number {
    let score = 0;
    for (const [factor, weight] of Object.entries(this.weights)) {
      score += factors[factor as keyof ImpactScoreFactors] * weight;
    }
    return Math.round(score);
  }

  private scoreToImpactLevel(score: number): NewsImpactLevel {
    if (score >= 90) return 'CRITICAL';
    if (score >= 75) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    if (score >= 25) return 'LOW';
    return 'NEGLIGIBLE';
  }

  private determineDirection(newsEvent: NewsEvent, factors: ImpactScoreFactors): SignalDirection {
    const baseDirection = this.sentimentDirectionMap[newsEvent.sentiment] || 'HOLD';
    
    if (factors.marketReaction > 70 && newsEvent.marketReaction.priceChange1h !== undefined) {
      const marketDirection = newsEvent.marketReaction.priceChange1h > 0 ? 'BUY' : 'SELL';
      if (marketDirection !== this.sentimentDirectionMap[newsEvent.sentiment] && 
          newsEvent.sentiment !== 'NEUTRAL') {
        return marketDirection;
      }
    }
    
    return baseDirection;
  }

  private calculateConfidence(factors: ImpactScoreFactors, newsEvent: NewsEvent): number {
    let confidence = 0;
    
    confidence += factors.sourceCredibility * 0.25;
    confidence += factors.confirmationLevel * 0.25;
    confidence += factors.marketReaction * 0.20;
    confidence += factors.relevanceToAsset * 0.15;
    confidence += factors.multipleSources * 0.10;
    confidence += factors.freshness * 0.05;
    
    return Math.round(Math.min(100, confidence));
  }

  private createBreakdown(factors: ImpactScoreFactors): ImpactScoreResult['breakdown'] {
    return Object.entries(factors).map(([factor, score]) => ({
      factor,
      weight: this.weights[factor as keyof typeof this.weights],
      score,
      contribution: Math.round(score * this.weights[factor as keyof typeof this.weights]),
    }));
  }

  setWeights(weights: Partial<typeof this.weights>): void {
    this.weights = { ...this.weights, ...weights };
  }
}

export const newsImpactScorer = new NewsImpactScorer();