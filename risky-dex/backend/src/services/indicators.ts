export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function calculateStochRSI(prices: number[], period = 14): { k: number; d: number } {
  const rsiValues: number[] = [];
  
  for (let i = period; i < prices.length; i++) {
    const slice = prices.slice(i - period, i + 1);
    rsiValues.push(calculateRSI(slice, period));
  }
  
  if (rsiValues.length < period) return { k: 50, d: 50 };
  
  const recentRsi = rsiValues.slice(-period);
  const minRsi = Math.min(...recentRsi);
  const maxRsi = Math.max(...recentRsi);
  const currentRsi = recentRsi[recentRsi.length - 1];
  
  const k = maxRsi === minRsi ? 50 : ((currentRsi - minRsi) / (maxRsi - minRsi)) * 100;
  
  const kValues: number[] = [];
  for (let i = Math.max(0, rsiValues.length - period); i < rsiValues.length; i++) {
    const slice = rsiValues.slice(i - period + 1, i + 1);
    const min = Math.min(...slice);
    const max = Math.max(...slice);
    const val = slice[slice.length - 1];
    kValues.push(max === min ? 50 : ((val - min) / (max - min)) * 100);
  }
  
  const d = kValues.reduce((a, b) => a + b, 0) / kValues.length;
  
  return { k, d };
}

export function calculateWilliamsR(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (highs.length < period) return -50;
  
  const recentHighs = highs.slice(-period);
  const recentLows = lows.slice(-period);
  const currentClose = closes[closes.length - 1];
  
  const highestHigh = Math.max(...recentHighs);
  const lowestLow = Math.min(...recentLows);
  
  if (highestHigh === lowestLow) return -50;
  
  return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
}

export function calculateMACD(prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): { value: number; signal: number; histogram: number } {
  const emaFast = calculateEMA(prices, fastPeriod);
  const emaSlow = calculateEMA(prices, slowPeriod);
  const macdLine = emaFast - emaSlow;
  
  const macdValues: number[] = [];
  for (let i = slowPeriod; i < prices.length; i++) {
    const fast = calculateEMA(prices.slice(0, i + 1), fastPeriod);
    const slow = calculateEMA(prices.slice(0, i + 1), slowPeriod);
    macdValues.push(fast - slow);
  }
  
  const signalLine = calculateEMA(macdValues, signalPeriod);
  const histogram = macdLine - signalLine;
  
  return { value: macdLine, signal: signalLine, histogram };
}

export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

export function calculateBollingerBands(prices: number[], period = 20, stdDev = 2): { upper: number; middle: number; lower: number; position: number } {
  if (prices.length < period) {
    const current = prices[prices.length - 1] || 0;
    return { upper: current * 1.02, middle: current, lower: current * 0.98, position: 50 };
  }
  
  const recent = prices.slice(-period);
  const middle = recent.reduce((a, b) => a + b, 0) / period;
  
  const variance = recent.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  const upper = middle + std * stdDev;
  const lower = middle - std * stdDev;
  const current = prices[prices.length - 1];
  const position = ((current - lower) / (upper - lower)) * 100;
  
  return { upper, middle, lower, position: Math.max(0, Math.min(100, position)) };
}

export function calculateVWAP(candles: { high: number; low: number; close: number; volume: number }[]): number {
  if (candles.length === 0) return 0;
  
  let cumulativePV = 0;
  let cumulativeVolume = 0;
  
  for (const c of candles) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumulativePV += typicalPrice * c.volume;
    cumulativeVolume += c.volume;
  }
  
  return cumulativeVolume > 0 ? cumulativePV / cumulativeVolume : candles[candles.length - 1].close;
}

export function calculateATR(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (highs.length < period + 1) return 0;
  
  const trueRanges: number[] = [];
  
  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }
  
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
  }
  
  return atr;
}

export function calculateVolumeRatio(volumes: number[], period = 20): number {
  if (volumes.length < period + 1) return 1;
  
  const recentVolumes = volumes.slice(-period);
  const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / period;
  const currentVolume = volumes[volumes.length - 1];
  
  return avgVolume > 0 ? currentVolume / avgVolume : 1;
}

export function detectSwingHighs(highs: number[], lookback = 5): number[] {
  const swings: number[] = [];
  
  for (let i = lookback; i < highs.length - lookback; i++) {
    let isSwing = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && highs[j] >= highs[i]) {
        isSwing = false;
        break;
      }
    }
    if (isSwing) swings.push(highs[i]);
  }
  
  return swings;
}

export function detectSwingLows(lows: number[], lookback = 5): number[] {
  const swings: number[] = [];
  
  for (let i = lookback; i < lows.length - lookback; i++) {
    let isSwing = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && lows[j] <= lows[i]) {
        isSwing = false;
        break;
      }
    }
    if (isSwing) swings.push(lows[i]);
  }
  
  return swings;
}

export function findSupportResistance(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[],
  lookback = 20
): { support: number[]; resistance: number[] } {
  const swingHighs = detectSwingHighs(highs, 5);
  const swingLows = detectSwingLows(lows, 5);
  
  const recentCloses = closes.slice(-lookback);
  const currentPrice = recentCloses[recentCloses.length - 1];
  
  const resistance = swingHighs
    .filter(h => h > currentPrice)
    .sort((a, b) => a - b)
    .slice(0, 5);
  
  const support = swingLows
    .filter(l => l < currentPrice)
    .sort((a, b) => b - a)
    .slice(0, 5);
  
  return { support, resistance };
}

export function analyzeVolume(candles: { close: number; volume: number }[]): {
  currentVolume: number;
  averageVolume: number;
  volumeRatio: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  buyVolume: number;
  sellVolume: number;
  delta: number;
} {
  if (candles.length < 20) {
    const last = candles[candles.length - 1];
    return {
      currentVolume: last?.volume || 0,
      averageVolume: last?.volume || 0,
      volumeRatio: 1,
      trend: 'STABLE',
      buyVolume: 0,
      sellVolume: 0,
      delta: 0,
    };
  }
  
  const recent = candles.slice(-20);
  const currentVolume = recent[recent.length - 1].volume;
  const averageVolume = recent.slice(0, -1).reduce((a, b) => a + b.volume, 0) / 19;
  const volumeRatio = averageVolume > 0 ? currentVolume / averageVolume : 1;
  
  const firstHalf = recent.slice(0, 10).reduce((a, b) => a + b.volume, 0);
  const secondHalf = recent.slice(10).reduce((a, b) => a + b.volume, 0);
  
  let trend: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
  if (secondHalf > firstHalf * 1.2) trend = 'INCREASING';
  else if (secondHalf < firstHalf * 0.8) trend = 'DECREASING';
  
  let buyVolume = 0;
  let sellVolume = 0;
  
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].close > recent[i - 1].close) {
      buyVolume += recent[i].volume;
    } else if (recent[i].close < recent[i - 1].close) {
      sellVolume += recent[i].volume;
    }
  }
  
  const delta = buyVolume - sellVolume;
  
  return { currentVolume, averageVolume, volumeRatio, trend, buyVolume, sellVolume, delta };
}