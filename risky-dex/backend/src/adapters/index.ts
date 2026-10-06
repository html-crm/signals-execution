import type { ExchangeName, ExchangeCredentials } from '@risky-dex/shared';
import { BaseExchangeAdapter } from './base';
import { BinanceAdapter } from './binance';
import { BybitAdapter } from './bybit';
import { OKXAdapter } from './okx';
import { BitgetAdapter } from './bitget';
import { BingXAdapter } from './bingx';

export function createExchangeAdapter(exchange: ExchangeName, credentials: ExchangeCredentials): BaseExchangeAdapter {
  switch (exchange) {
    case 'BINANCE':
      return new BinanceAdapter(credentials);
    case 'BYBIT':
      return new BybitAdapter(credentials);
    case 'OKX':
      return new OKXAdapter(credentials);
    case 'BITGET':
      return new BitgetAdapter(credentials);
    case 'BINGX':
      return new BingXAdapter(credentials);
    default:
      throw new Error(`Unsupported exchange: ${exchange}`);
  }
}

export function getSupportedExchanges(): ExchangeName[] {
  return ['BINANCE', 'BYBIT', 'OKX', 'BITGET', 'BINGX'];
}

export { BaseExchangeAdapter };
export { BinanceAdapter } from './binance';
export { BybitAdapter } from './bybit';
export { OKXAdapter } from './okx';
export { BitgetAdapter } from './bitget';
export { BingXAdapter } from './bingx';