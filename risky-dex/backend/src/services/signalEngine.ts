import type {
  SignalInput,
  SignalOutput,
  IndicatorValues,
  VolumeAnalysis,
  Timeframe,
  ExchangeName,
  SignalDirection,
  SignalStrength,
} from '@risky-dex/shared';
import { marketDataService } from './marketData';
import {
  calculateRSI,
  calculateStochRSI,
  calculateWilliamsR,
  calculateMACD,
  calculateEMA,
  calculateBollingerBands,
  calculateVWAP,
  calculateATR,
  calculateVolumeRatio,
  findSupportResistance,
  analyzeVolume,
} from './indicators';

interface ScoringWeights {
  trend: number;
  momentum: number;
  volume: number;
  structure: number;
  futures: number;
  risk: number;
}

interface ScoreBreakdown {
  trend: number;
  momentum: number;
  volume: number;
  structure: number;
  futures: number;
  risk: number;
  total: number;
}

export class SignalEngine {
  private weights: ScoringWeights = {
    trend: 25,
    momentum: 25,
    volume: 15,
    structure: 15,
    futures: 10,
    risk: 10,
  };
  
  private confidenceThresholds = {
    weak: 40,
    neutral: 60,
    strong: 75,
    veryStrong: 90,
  };
  
  setWeights(weights: Partial<ScoringWeights>): void {
    this.weights = { ...this.weights, ...weights };
  }
  
  setConfidenceThresholds(thresholds: Partial<typeof this.confidenceThresholds>): void {
    this.confidenceThresholds = { ...this.confidenceThresholds, ...thresholds };
  }
  
  async analyze(input: SignalInput): Promise<SignalOutput> {
    const { candles, ticker, orderBook, fundingRate, openInterest } = input;
    
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);
    
    const indicators = this.calculateIndicators(candles);
    const volumeAnalysis = analyzeVolume(candles.map(c => ({ close: c.close, volume: c.volume })));
    const { support, resistance } = findSupportResistance(highs, lows, closes, volumes);
    
    const scores = this.calculateScores({
      indicators,
      volumeAnalysis,
      ticker,
      fundingRate,
      openInterest,
      support,
      resistance,
      currentPrice: ticker.price,
    });
    
    const totalScore = scores.total;
    const { direction, strength, confidence } = this.determineSignal(totalScore, indicators);
    
    const { entryPrice, entryZoneLow, entryZoneHigh, stopLoss, takeProfit1, takeProfit2, riskReward, invalidationLevel } =
      this.calculateLevels(direction, ticker.price, indicators, support, resistance);
    
    const reasons = this.generateReasons(scores, indicators, volumeAnalysis, direction);
    const warnings = this.generateWarnings(scores, indicators, volumeAnalysis);
    
    return {
      direction,
      strength,
      confidence,
      entryPrice,
      entryZoneLow,
      entryZoneHigh,
      stopLoss,
      takeProfit1,
      takeProfit2,
      riskReward,
      invalidationLevel,
      trendScore: scores.trend,
      momentumScore: scores.momentum,
      volumeScore: scores.volume,
      structureScore: scores.structure,
      futuresScore: scores.futures,
      riskScore: scores.risk,
      indicators,
      supportLevels: support,
      resistanceLevels: resistance,
      fundingRate: fundingRate?.rate || 0,
      openInterest: openInterest?.value || 0,
      volumeAnalysis,
      reasons,
      warnings,
    };
  }
  
  private calculateIndicators(candles: { open: number; high: number; low: number; close: number; volume: number }[]): IndicatorValues {
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    
    const rsi = calculateRSI(closes);
    const stochRsi = calculateStochRSI(closes);
    const williamsR = calculateWilliamsR(highs, lows, closes);
    const macd = calculateMACD(closes);
    const bollingerBands = calculateBollingerBands(closes);
    const vwap = calculateVWAP(candles);
    const ema200 = calculateEMA(closes, 200);
    const ema50 = calculateEMA(closes, 50);
    const ema20 = calculateEMA(closes, 20);
    const atr = calculateATR(highs, lows, closes);
    const volumeRatio = calculateVolumeRatio(candles.map(c => c.volume));
    
    let emaTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (ema20 > ema50 && ema50 > ema200) emaTrend = 'BULLISH';
    else if (ema20 < ema50 && ema50 < ema200) emaTrend = 'BEARISH';
    
    const currentPrice = closes[closes.length - 1];
    const volumeTrend = volumeRatio > 1.2 ? 'INCREASING' : volumeRatio < 0.8 ? 'DECREASING' : 'STABLE';
    
    return {
      rsi,
      stochRsi,
      williamsR,
      macd,
      bollingerBands,
      vwap,
      ema200,
      emaTrend,
      atr,
      volumeRatio,
      volumeTrend,
      currentPrice,
    };
  }
  
  private calculateScores(params: {
    indicators: IndicatorValues;
    volumeAnalysis: any;
    ticker: any;
    fundingRate?: any;
    openInterest?: any;
    support: number[];
    resistance: number[];
    currentPrice: number;
  }): ScoreBreakdown {
    const { indicators, volumeAnalysis, ticker, fundingRate, openInterest, support, resistance, currentPrice } = params;
    
    let trendScore = 0;
    if (indicators.emaTrend === 'BULLISH') trendScore += 15;
    else if (indicators.emaTrend === 'BEARISH') trendScore += 5;
    else trendScore += 10;
    
    if (currentPrice > indicators.ema200) trendScore += 10;
    else trendScore += 0;
    
    let momentumScore = 0;
    if (indicators.rsi > 50 && indicators.rsi < 70) momentumScore += 10;
    else if (indicators.rsi >= 70) momentumScore += 5;
    else if (indicators.rsi <= 30) momentumScore += 5;
    else momentumScore += 2;
    
    if (indicators.macd.histogram > 0) momentumScore += 10;
    else momentumScore += 2;
    
    if (indicators.stochRsi.k > 50) momentumScore += 5;
    else momentumScore += 2;
    
    let volumeScore = 0;
    if (volumeAnalysis.volumeRatio >= 1.5) volumeScore += 15;
    else if (volumeAnalysis.volumeRatio >= 1.2) volumeScore += 10;
    else if (volumeAnalysis.volumeRatio >= 1.0) volumeScore += 7;
    else if (volumeAnalysis.volumeRatio >= 0.8) volumeScore += 4;
    else volumeScore += 1;
    
    if (volumeAnalysis.trend === 'INCREASING') volumeScore += 3;
    else if (volumeAnalysis.trend === 'DECREASING') volumeScore += 1;
    else volumeScore += 2;
    
    let structureScore = 0;
    const nearSupport = support.some(s => (currentPrice - s) / currentPrice < 0.02);
    const nearResistance = resistance.some(r => (r - currentPrice) / currentPrice < 0.02);
    
    if (nearSupport && !nearResistance) structureScore += 15;
    else if (!nearSupport && nearResistance) structureScore += 5;
    else if (nearSupport && nearResistance) structureScore += 8;
    else structureScore += 10;
    
    let futuresScore = 0;
    if (fundingRate) {
      const rate = fundingRate.rate;
      if (rate > 0.0001 && rate < 0.001) futuresScore += 5;
      else if (rate >= 0.001) futuresScore += 3;
      else if (rate < -0.0001) futuresScore += 8;
      else futuresScore += 5;
    } else {
      futuresScore += 5;
    }
    
    if (openInterest) {
      futuresScore += 5;
    }
    
    let riskScore = 10;
    if (indicators.rsi > 80 || indicators.rsi < 20) riskScore -= 3;
    if (indicators.bollingerBands.position > 95 || indicators.bollingerBands.position < 5) riskScore -= 2;
    if (volumeAnalysis.volumeRatio < 0.5) riskScore -= 2;
    
    riskScore = Math.max(0, Math.min(10, riskScore));
    
    const total = trendScore + momentumScore + volumeScore + structureScore + futuresScore + riskScore;
    
    return { trend: trendScore, momentum: momentumScore, volume: volumeScore, structure: structureScore, futures: futuresScore, risk: riskScore, total };
  }
  
  private determineSignal(totalScore: number, indicators: IndicatorValues): { direction: SignalDirection; strength: SignalStrength; confidence: number } {
    const confidence = Math.min(100, Math.max(0, totalScore));
    
    let direction: SignalDirection;
    let strength: SignalStrength;
    
    if (confidence >= this.confidenceThresholds.veryStrong) {
      strength = 'VERY_STRONG';
      direction = indicators.emaTrend === 'BULLISH' ? 'LONG' : 'SHORT';
    } else if (confidence >= this.confidenceThresholds.strong) {
      strength = 'STRONG';
      direction = indicators.emaTrend === 'BULLISH' ? 'LONG' : 'SHORT';
    } else if (confidence >= this.confidenceThresholds.neutral) {
      strength = 'NEUTRAL';
      direction = indicators.emaTrend === 'BULLISH' ? 'LONG' : 'SHORT';
    } else if (confidence >= this.confidenceThresholds.weak) {
      strength = 'WEAK';
      direction = indicators.emaTrend === 'BULLISH' ? 'BUY' : 'SELL';
    } else {
      strength = 'WEAK';
      direction = 'HOLD';
    }
    
    if (direction === 'LONG' && indicators.emaTrend !== 'BULLISH') direction = 'BUY';
    if (direction === 'SHORT' && indicators.emaTrend !== 'BEARISH') direction = 'SELL';
    
    return { direction, strength, confidence };
  }
  
  private calculateLevels(
    direction: SignalDirection,
    currentPrice: number,
    indicators: IndicatorValues,
    support: number[],
    resistance: number[]
  ): { entryPrice: number; entryZoneLow: number; entryZoneHigh: number; stopLoss: number; takeProfit1: number; takeProfit2?: number; riskReward: number; invalidationLevel?: number } {
    const atr = indicators.atr || currentPrice * 0.02;
    const isLong = direction === 'LONG' || direction === 'BUY';
    
    let entryPrice = currentPrice;
    let stopLoss: number;
    let takeProfit1: number;
    let takeProfit2: number | undefined;
    let invalidationLevel: number | undefined;
    
    if (isLong) {
      const nearestSupport = support.find(s => s < currentPrice);
      stopLoss = nearestSupport ? nearestSupport * 0.995 : currentPrice - atr * 1.5;
      takeProfit1 = resistance.find(r => r > currentPrice) || currentPrice + atr * 2;
      takeProfit2 = currentPrice + atr * 3;
      invalidationLevel = stopLoss * 0.99;
    } else {
      const nearestResistance = resistance.find(r => r > currentPrice);
      stopLoss = nearestResistance ? nearestResistance * 1.005 : currentPrice + atr * 1.5;
      takeProfit1 = support.find(s => s < currentPrice) || currentPrice - atr * 2;
      takeProfit2 = currentPrice - atr * 3;
      invalidationLevel = stopLoss * 1.01;
    }
    
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit1 - entryPrice);
    const riskReward = risk > 0 ? reward / risk : 0;
    
    const entryZoneLow = isLong ? entryPrice * 0.998 : entryPrice * 0.995;
    const entryZoneHigh = isLong ? entryPrice * 1.002 : entryPrice * 1.005;
    
    return { entryPrice, entryZoneLow, entryZoneHigh, stopLoss, takeProfit1, takeProfit2, riskReward, invalidationLevel };
  }
  
  private generateReasons(scores: ScoreBreakdown, indicators: IndicatorValues, volumeAnalysis: any, direction: SignalDirection): string[] {
    const reasons: string[] = [];
    const isLong = direction === 'LONG' || direction === 'BUY';
    
    if (scores.trend >= 20) {
      reasons.push(isLong ? 'EMA trend is bullish' : 'EMA trend is bearish');
    }
    
    if (indicators.currentPrice > indicators.ema200) {
      reasons.push('Price is above EMA 200');
    }
    
    if (scores.momentum >= 20) {
      reasons.push('Momentum indicators are favorable');
    }
    
    if (indicators.macd.histogram > 0) {
      reasons.push('MACD histogram is positive');
    }
    
    if (volumeAnalysis.volumeRatio > 1.2) {
      reasons.push('Volume confirmation is strong');
    } else if (volumeAnalysis.volumeRatio < 0.8) {
      reasons.push('Volume confirmation is weak');
    }
    
    if (indicators.rsi > 50 && indicators.rsi < 70) {
      reasons.push('RSI is in healthy range');
    }
    
    if (indicators.bollingerBands.position < 30 && !isLong) {
      reasons.push('Price near lower Bollinger Band');
    }
    
    return reasons;
  }
  
  private generateWarnings(scores: ScoreBreakdown, indicators: IndicatorValues, volumeAnalysis: any): string[] {
    const warnings: string[] = [];
    
    if (volumeAnalysis.volumeRatio < 0.8) {
      warnings.push('Volume is below average');
    }
    
    if (indicators.rsi > 75) {
      warnings.push('RSI indicates overbought conditions');
    } else if (indicators.rsi < 25) {
      warnings.push('RSI indicates oversold conditions');
    }
    
    if (indicators.bollingerBands.position > 90) {
      warnings.push('Price near upper Bollinger Band');
    } else if (indicators.bollingerBands.position < 10) {
      warnings.push('Price near lower Bollinger Band');
    }
    
    if (scores.futures < 5) {
      warnings.push('Futures metrics not confirming');
    }
    
    if (scores.risk < 5) {
      warnings.push('Elevated risk detected');
    }
    
    return warnings;
  }
}

export const signalEngine = new SignalEngine();