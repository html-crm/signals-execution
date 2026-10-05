import type { RiskCalculation, OrderParams, PositionInfo, OrderType, OrderSide, Timeframe } from '@risky-dex/shared';

interface RiskSettings {
  maxTradeSize: number;
  maxDailyLoss: number;
  maxExposure: number;
  maxOpenPositions: number;
  maxSlippage: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  emergencyShutdown: boolean;
  riskPerTrade: number;
  stopLossATRMultiplier: number;
  takeProfitATRMultiplier: number;
  maxLeverage: number;
}

export class RiskEngine {
  private settings: RiskSettings = {
    maxTradeSize: 1000,
    maxDailyLoss: 200,
    maxExposure: 5000,
    maxOpenPositions: 5,
    maxSlippage: 1,
    stopLossPercent: 2,
    takeProfitPercent: 4,
    emergencyShutdown: false,
    riskPerTrade: 1,
    stopLossATRMultiplier: 1.5,
    takeProfitATRMultiplier: 2.5,
    maxLeverage: 10,
  };
  
  private dailyPnl = 0;
  private openPositionsCount = 0;
  private currentExposure = 0;
  
  configure(settings: Partial<RiskSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }
  
  updateDailyPnl(pnl: number): void {
    this.dailyPnl = pnl;
  }
  
  updatePositions(count: number, exposure: number): void {
    this.openPositionsCount = count;
    this.currentExposure = exposure;
  }
  
  calculatePositionSize(params: {
    balance: number;
    entryPrice: number;
    stopLossPrice: number;
    leverage: number;
    side: OrderSide;
  }): RiskCalculation {
    const { balance, entryPrice, stopLossPrice, leverage, side } = params;
    
    const riskAmount = balance * (this.settings.riskPerTrade / 100);
    const riskPerUnit = Math.abs(entryPrice - stopLossPrice);
    const positionSize = riskPerUnit > 0 ? riskAmount / riskPerUnit : 0;
    
    const maxSizeBySettings = this.settings.maxTradeSize / entryPrice;
    const maxSizeByExposure = (this.settings.maxExposure - this.currentExposure) / entryPrice;
    const maxSizeByLeverage = (balance * leverage) / entryPrice;
    
    const finalSize = Math.min(positionSize, maxSizeBySettings, maxSizeByExposure, maxSizeByLeverage);
    const marginRequired = (finalSize * entryPrice) / leverage;
    const maxLoss = finalSize * riskPerUnit;
    const takeProfitPrice = side === 'BUY' 
      ? entryPrice + riskPerUnit * (this.settings.takeProfitATRMultiplier / this.settings.stopLossATRMultiplier)
      : entryPrice - riskPerUnit * (this.settings.takeProfitATRMultiplier / this.settings.stopLossATRMultiplier);
    
    const riskRewardRatio = riskPerUnit > 0 ? Math.abs(takeProfitPrice - entryPrice) / riskPerUnit : 0;
    
    let liquidationPrice: number | undefined;
    if (leverage > 1) {
      const maintenanceMargin = 0.005;
      if (side === 'BUY') {
        liquidationPrice = entryPrice * (1 - 1/leverage + maintenanceMargin);
      } else {
        liquidationPrice = entryPrice * (1 + 1/leverage - maintenanceMargin);
      }
    }
    
    return {
      positionSize: finalSize,
      marginRequired,
      maxLoss,
      stopLossPrice,
      takeProfitPrice,
      riskRewardRatio,
      leverage,
      liquidationPrice,
    };
  }
  
  validateOrder(params: {
    order: OrderParams;
    balance: number;
    currentPositions: PositionInfo[];
    dailyPnl: number;
  }): { valid: boolean; errors: string[]; warnings: string[] } {
    const { order, balance, currentPositions, dailyPnl } = params;
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (this.settings.emergencyShutdown) {
      errors.push('Emergency shutdown is active');
    }
    
    if (dailyPnl <= -this.settings.maxDailyLoss) {
      errors.push(`Daily loss limit exceeded: ${dailyPnl} <= -${this.settings.maxDailyLoss}`);
    }
    
    if (currentPositions.length >= this.settings.maxOpenPositions) {
      errors.push(`Max open positions reached: ${currentPositions.length} >= ${this.settings.maxOpenPositions}`);
    }
    
    const orderValue = order.amount * (order.price || 0);
    if (orderValue > this.settings.maxTradeSize) {
      errors.push(`Order value exceeds max trade size: ${orderValue} > ${this.settings.maxTradeSize}`);
    }
    
    const newExposure = this.currentExposure + orderValue;
    if (newExposure > this.settings.maxExposure) {
      errors.push(`Total exposure would exceed limit: ${newExposure} > ${this.settings.maxExposure}`);
    }
    
    if (order.leverage && order.leverage > this.settings.maxLeverage) {
      warnings.push(`Leverage ${order.leverage}x exceeds recommended max of ${this.settings.maxLeverage}x`);
    }
    
    if (order.type === 'MARKET') {
      warnings.push('Market order may experience slippage');
    }
    
    const sameSymbolPositions = currentPositions.filter(p => p.symbol === order.symbol);
    if (sameSymbolPositions.length > 0) {
      warnings.push(`Already have position in ${order.symbol}`);
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }
  
  calculateStopLoss(entryPrice: number, atr: number, side: OrderSide): number {
    const multiplier = this.settings.stopLossATRMultiplier;
    return side === 'BUY' 
      ? entryPrice - atr * multiplier
      : entryPrice + atr * multiplier;
  }
  
  calculateTakeProfit(entryPrice: number, atr: number, side: OrderSide): number {
    const multiplier = this.settings.takeProfitATRMultiplier;
    return side === 'BUY'
      ? entryPrice + atr * multiplier
      : entryPrice - atr * multiplier;
  }
  
  calculateTrailingStop(currentPrice: number, highestPrice: number, lowestPrice: number, side: OrderSide, atr: number): number {
    const trailDistance = atr * 1.5;
    
    if (side === 'BUY') {
      return Math.max(highestPrice - trailDistance, currentPrice - trailDistance);
    } else {
      return Math.min(lowestPrice + trailDistance, currentPrice + trailDistance);
    }
  }
  
  checkStopLoss(position: PositionInfo, currentPrice: number): boolean {
    if (position.stopLoss) {
      if (position.side === 'LONG' && currentPrice <= position.stopLoss) return true;
      if (position.side === 'SHORT' && currentPrice >= position.stopLoss) return true;
    }
    return false;
  }
  
  checkTakeProfit(position: PositionInfo, currentPrice: number): boolean {
    if (position.takeProfit) {
      if (position.side === 'LONG' && currentPrice >= position.takeProfit) return true;
      if (position.side === 'SHORT' && currentPrice <= position.takeProfit) return true;
    }
    return false;
  }
  
  checkLiquidation(position: PositionInfo, currentPrice: number): boolean {
    if (position.liquidationPrice) {
      if (position.side === 'LONG' && currentPrice <= position.liquidationPrice) return true;
      if (position.side === 'SHORT' && currentPrice >= position.liquidationPrice) return true;
    }
    return false;
  }
  
  getAvailableMargin(balance: number): number {
    return balance - this.currentExposure;
  }
  
  getMaxPositionSize(balance: number, entryPrice: number, leverage: number): number {
    const byExposure = (this.settings.maxExposure - this.currentExposure) / entryPrice;
    const byLeverage = (balance * leverage) / entryPrice;
    const bySettings = this.settings.maxTradeSize / entryPrice;
    return Math.max(0, Math.min(byExposure, byLeverage, bySettings));
  }
  
  isDailyLossLimitReached(): boolean {
    return this.dailyPnl <= -this.settings.maxDailyLoss;
  }
  
  getRiskMetrics(): {
    dailyPnl: number;
    dailyLossLimit: number;
    dailyLossPercent: number;
    openPositions: number;
    maxOpenPositions: number;
    currentExposure: number;
    maxExposure: number;
    exposurePercent: number;
    emergencyShutdown: boolean;
  } {
    return {
      dailyPnl: this.dailyPnl,
      dailyLossLimit: this.settings.maxDailyLoss,
      dailyLossPercent: this.settings.maxDailyLoss > 0 ? (this.dailyPnl / this.settings.maxDailyLoss) * 100 : 0,
      openPositions: this.openPositionsCount,
      maxOpenPositions: this.settings.maxOpenPositions,
      currentExposure: this.currentExposure,
      maxExposure: this.settings.maxExposure,
      exposurePercent: this.settings.maxExposure > 0 ? (this.currentExposure / this.settings.maxExposure) * 100 : 0,
      emergencyShutdown: this.settings.emergencyShutdown,
    };
  }
}

export const riskEngine = new RiskEngine();