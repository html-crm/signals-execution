import type {
  NewsEvent,
  NewsAssetMapping,
  NewsCategory,
  NewsSentiment,
  NewsImpactLevel,
  SignalDirection,
} from '@types';

interface AssetRelation {
  asset: string;
  baseAsset: string;
  quoteAsset: string;
  category: string;
  relationship: 'DIRECT' | 'ECOSYSTEM' | 'COMPETITOR' | 'CORRELATED' | 'DERIVATIVE';
  baseRelevance: number;
}

const ASSET_RELATIONSHIPS: Record<string, AssetRelation[]> = {
  BTC: [
    { asset: 'BTC', baseAsset: 'BTC', quoteAsset: 'USDT', category: 'LAYER1', relationship: 'DIRECT', baseRelevance: 100 },
    { asset: 'ETH', baseAsset: 'ETH', quoteAsset: 'USDT', category: 'LAYER1', relationship: 'CORRELATED', baseRelevance: 45 },
    { asset: 'BNB', baseAsset: 'BNB', quoteAsset: 'USDT', category: 'LAYER1', relationship: 'CORRELATED', baseRelevance: 40 },
    { asset: 'SOL', baseAsset: 'SOL', quoteAsset: 'USDT', category: 'LAYER1', relationship: 'CORRELATED', baseRelevance: 35 },
  ],
  ETH: [
    { asset: 'ETH', baseAsset: 'ETH', quoteAsset: 'USDT', category: 'LAYER1', relationship: 'DIRECT', baseRelevance: 100 },
    { asset: 'ARB', baseAsset: 'ARB', quoteAsset: 'USDT', category: 'LAYER2', relationship: 'ECOSYSTEM', baseRelevance: 80 },
    { asset: 'OP', baseAsset: 'OP', quoteAsset: 'USDT', category: 'LAYER2', relationship: 'ECOSYSTEM', baseRelevance: 75 },
    { asset: 'LDO', baseAsset: 'LDO', quoteAsset: 'USDT', category: 'DEFI', relationship: 'ECOSYSTEM', baseRelevance: 70 },
    { asset: 'MATIC', baseAsset: 'MATIC', quoteAsset: 'USDT', category: 'LAYER2', relationship: 'ECOSYSTEM', baseRelevance: 65 },
    { asset: 'BTC', baseAsset: 'BTC', quoteAsset: 'USDT', category: 'LAYER1', relationship: 'CORRELATED', baseRelevance: 50 },
  ],
  SOL: [
    { asset: 'SOL', baseAsset: 'SOL', quoteAsset: 'USDT', category: 'LAYER1', relationship: 'DIRECT', baseRelevance: 100 },
    { asset: 'RAY', baseAsset: 'RAY', quoteAsset: 'USDT', category: 'DEFI', relationship: 'ECOSYSTEM', baseRelevance: 70 },
    { asset: 'JUP', baseAsset: 'JUP', quoteAsset: 'USDT', category: 'DEFI', relationship: 'ECOSYSTEM', baseRelevance: 65 },
    { asset: 'BONK', baseAsset: 'BONK', quoteAsset: 'SOL', category: 'MEME', relationship: 'ECOSYSTEM', baseRelevance: 40 },
    { asset: 'WIF', baseAsset: 'WIF', quoteAsset: 'SOL', category: 'MEME', relationship: 'ECOSYSTEM', baseRelevance: 35 },
  ],
  BNB: [
    { asset: 'BNB', baseAsset: 'BNB', quoteAsset: 'USDT', category: 'LAYER1', relationship: 'DIRECT', baseRelevance: 100 },
    { asset: 'CAKE', baseAsset: 'CAKE', quoteAsset: 'USDT', category: 'DEFI', relationship: 'ECOSYSTEM', baseRelevance: 75 },
    { asset: 'BSC', baseAsset: 'BSC', quoteAsset: 'USDT', category: 'LAYER1', relationship: 'ECOSYSTEM', baseRelevance: 60 },
  ],
};

const CATEGORY_ASSET_MAP: Record<NewsCategory, string[]> = {
  REGULATORY: ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'MATIC'],
  ETF: ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOT', 'LINK', 'AVAX'],
  EXCHANGE_LISTING: ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'MATIC', 'AVAX', 'DOT', 'LINK', 'UNI', 'ATOM', 'NEAR', 'FTM', 'ALGO', 'VET', 'ICP', 'THETA', 'FIL', 'HBAR'],
  EXCHANGE_DELISTING: ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'MATIC', 'AVAX', 'DOT', 'LINK'],
  PARTNERSHIP: ['BTC', 'ETH', 'SOL', 'BNB', 'MATIC', 'AVAX', 'DOT', 'LINK', 'UNI', 'NEAR', 'ATOM', 'FTM', 'ALGO'],
  PROTOCOL_UPGRADE: ['ETH', 'SOL', 'BNB', 'MATIC', 'AVAX', 'DOT', 'ATOM', 'NEAR', 'FTM', 'ALGO'],
  TOKEN_UNLOCK: ['SOL', 'AVAX', 'DOT', 'ATOM', 'NEAR', 'FTM', 'ALGO', 'MATIC', 'ARB', 'OP', 'IMX', 'BLUR', 'LDO', 'APT', 'SUI', 'SEI', 'TIA', 'INJ'],
  HACK_EXPLOIT: ['BTC', 'ETH', 'BNB', 'SOL', 'MATIC', 'AVAX', 'ARB', 'OP', 'BASE'],
  SECURITY_INCIDENT: ['BTC', 'ETH', 'BNB', 'SOL', 'MATIC', 'AVAX', 'ARB', 'OP'],
  WHALE_ACTIVITY: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC'],
  MACRO_ECONOMIC: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE'],
  FED_DECISION: ['BTC', 'ETH', 'SOL', 'BNB'],
  CPI_DATA: ['BTC', 'ETH', 'SOL', 'BNB'],
  EMPLOYMENT_DATA: ['BTC', 'ETH'],
  EARNINGS: ['BTC', 'ETH', 'COIN', 'MSTR', 'RIOT', 'MARA'],
  CORPORATE_ADOPTION: ['BTC', 'ETH', 'SOL', 'BNB', 'MATIC', 'AVAX'],
  GOVERNANCE: ['ETH', 'SOL', 'BNB', 'MATIC', 'AVAX', 'DOT', 'ATOM', 'UNI', 'ARB', 'OP'],
  AIRDROP: ['ARB', 'OP', 'BLUR', 'ENS', 'LOOKS', 'SUDO', 'IMX', 'TIA', 'DYM', 'STRK', 'JUP', 'WEN', 'PYTH', 'JTO'],
  BURN: ['BNB', 'SHIB', 'FLOKI', 'BONE', 'LEASH'],
  STAKING: ['ETH', 'SOL', 'ADA', 'DOT', 'ATOM', 'MATIC', 'AVAX', 'NEAR', 'FTM', 'ALGO'],
  DEFI_LAUNCH: ['ETH', 'SOL', 'BNB', 'MATIC', 'AVAX', 'ARB', 'OP', 'BASE', 'FTM', 'DOT', 'ATOM'],
  NFT: ['ETH', 'SOL', 'MATIC', 'AVAX', 'IMX', 'FLOW', 'APT'],
  MEME_COIN: ['DOGE', 'SHIB', 'PEPE', 'BONK', 'WIF', 'FLOKI', 'BABYDOGE', 'MYRO', 'POPCAT', 'BOME'],
  LAYER2: ['ARB', 'OP', 'MATIC', 'BASE', 'ZKSYNC', 'STARKNET', 'LINEA', 'SCROLL', 'MANTA', 'BLAST'],
  INFRASTRUCTURE: ['LINK', 'GRT', 'RNDR', 'FET', 'OCEAN', 'AGIX', 'TAO', 'AKASH', 'IO'],
  OTHER: ['BTC', 'ETH', 'SOL', 'BNB'],
};

export class NewsAssetMapper {
  private readonly customMappings: Map<string, AssetRelation[]> = new Map();
  private readonly assetCategories: Map<string, string> = new Map();

  constructor() {
    this.initializeAssetCategories();
  }

  private initializeAssetCategories(): void {
    for (const [category, assets] of Object.entries(CATEGORY_ASSET_MAP)) {
      for (const asset of assets) {
        if (!this.assetCategories.has(asset)) {
          this.assetCategories.set(asset, category);
        }
      }
    }
  }

  mapAssets(newsEvent: NewsEvent): NewsAssetMapping[] {
    const mappings: NewsAssetMapping[] = [];
    const categoryAssets = CATEGORY_ASSET_MAP[newsEvent.category] || ['BTC', 'ETH'];
    const primaryAsset = this.determinePrimaryAsset(newsEvent, categoryAssets);

    for (const asset of categoryAssets) {
      const relevance = this.calculateRelevance(newsEvent, asset, categoryAssets, primaryAsset);
      if (relevance >= 20) {
        const mapping: NewsAssetMapping = {
          id: `${newsEvent.id}-${asset}`,
          newsEventId: newsEvent.id,
          asset,
          baseAsset: asset,
          quoteAsset: 'USDT',
          relevanceScore: relevance,
          direction: this.determineDirection(newsEvent, asset),
          sentiment: this.determineSentiment(newsEvent, asset),
          expectedImpact: this.determineExpectedImpact(newsEvent, relevance),
          reasoning: this.generateReasoning(newsEvent, asset, relevance),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mappings.push(mapping);
      }
    }

    const ecosystemMappings = this.getEcosystemMappings(newsEvent, primaryAsset);
    mappings.push(...ecosystemMappings);

    mappings.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return mappings.slice(0, 20);
  }

  private determinePrimaryAsset(newsEvent: NewsEvent, categoryAssets: string[]): string {
    if (newsEvent.primaryAsset && categoryAssets.includes(newsEvent.primaryAsset)) {
      return newsEvent.primaryAsset;
    }

    const content = `${newsEvent.title} ${newsEvent.summary || ''} ${newsEvent.content || ''}`.toLowerCase();
    
    for (const asset of categoryAssets) {
      const assetLower = asset.toLowerCase();
      if (content.includes(assetLower) || content.includes(`$${assetLower}`)) {
        return asset;
      }
    }

    return categoryAssets[0];
  }

  private calculateRelevance(
    newsEvent: NewsEvent, 
    asset: string, 
    categoryAssets: string[],
    primaryAsset: string
  ): number {
    let relevance = 30;

    if (asset === primaryAsset) {
      relevance = 95;
    } else {
      const relationship = this.getRelationship(primaryAsset, asset);
      if (relationship) {
        relevance = relationship.baseRelevance;
      } else {
        relevance = Math.max(25, 50 - categoryAssets.indexOf(asset) * 3);
      }
    }

    const content = `${newsEvent.title} ${newsEvent.summary || ''} ${newsEvent.content || ''}`.toLowerCase();
    const assetLower = asset.toLowerCase();
    
    if (content.includes(assetLower) || content.includes(`$${assetLower}`)) {
      relevance += 15;
    }

    const entityKey = asset.toUpperCase();
    if (newsEvent.entities[entityKey]) {
      relevance += 10;
    }

    if (newsEvent.keywords.some(k => k.toLowerCase().includes(assetLower))) {
      relevance += 10;
    }

    return Math.min(100, relevance);
  }

  private getRelationship(primaryAsset: string, targetAsset: string): AssetRelation | undefined {
    const relations = ASSET_RELATIONSHIPS[primaryAsset];
    if (!relations) return undefined;
    return relations.find(r => r.asset === targetAsset);
  }

  private getEcosystemMappings(newsEvent: NewsEvent, primaryAsset: string): NewsAssetMapping[] {
    const mappings: NewsAssetMapping[] = [];
    const relations = ASSET_RELATIONSHIPS[primaryAsset];
    
    if (!relations) return mappings;

    for (const relation of relations) {
      if (relation.relationship === 'ECOSYSTEM' && relation.baseRelevance >= 50) {
        const mapping: NewsAssetMapping = {
          id: `${newsEvent.id}-${relation.asset}`,
          newsEventId: newsEvent.id,
          asset: relation.asset,
          baseAsset: relation.baseAsset,
          quoteAsset: relation.quoteAsset,
          relevanceScore: Math.min(relation.baseRelevance, 75),
          direction: this.determineDirection(newsEvent, relation.asset),
          sentiment: this.determineSentiment(newsEvent, relation.asset),
          expectedImpact: this.determineExpectedImpact(newsEvent, relation.baseRelevance),
          reasoning: `Ecosystem token affected by ${primaryAsset} news`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mappings.push(mapping);
      }
    }

    return mappings;
  }

  private determineDirection(newsEvent: NewsEvent, asset: string): SignalDirection {
    if (newsEvent.direction !== 'HOLD') {
      return newsEvent.direction;
    }

    const sentiment = this.determineSentiment(newsEvent, asset);
    if (sentiment === 'BULLISH' || sentiment === 'VERY_BULLISH') return 'LONG';
    if (sentiment === 'BEARISH' || sentiment === 'VERY_BEARISH') return 'SHORT';
    return 'HOLD';
  }

  private determineSentiment(newsEvent: NewsEvent, asset: string): NewsSentiment {
    if (asset === newsEvent.primaryAsset) {
      return newsEvent.sentiment;
    }

    const sentimentBoost: Record<string, number> = {
      VERY_BULLISH: 2,
      BULLISH: 1,
      NEUTRAL: 0,
      BEARISH: -1,
      VERY_BEARISH: -2,
    };

    const boost = sentimentBoost[newsEvent.sentiment] || 0;
    const baseIndex = Object.values(NewsSentiment).indexOf(newsEvent.sentiment);
    const newIndex = Math.max(0, Math.min(4, baseIndex + boost));
    
    return Object.values(NewsSentiment)[newIndex] as NewsSentiment;
  }

  private determineExpectedImpact(newsEvent: NewsEvent, relevance: number): NewsImpactLevel {
    const baseImpact = newsEvent.impactLevel;
    const levels: NewsImpactLevel[] = ['NEGLIGIBLE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const baseIndex = levels.indexOf(baseImpact);
    
    let adjustedIndex = baseIndex;
    if (relevance > 80) adjustedIndex = Math.min(4, baseIndex + 1);
    else if (relevance < 40) adjustedIndex = Math.max(0, baseIndex - 1);
    
    return levels[adjustedIndex];
  }

  private generateReasoning(newsEvent: NewsEvent, asset: string, relevance: number): string {
    if (asset === newsEvent.primaryAsset) {
      return `Directly mentioned in ${newsEvent.category.toLowerCase().replace('_', ' ')} news`;
    }
    
    return `${asset} is part of ${newsEvent.primaryAsset || 'the crypto'} ecosystem and may be affected by ${newsEvent.category.toLowerCase().replace('_', ' ')} news (relevance: ${relevance}%)`;
  }

  addCustomMapping(asset: string, relations: AssetRelation[]): void {
    this.customMappings.set(asset, relations);
  }

  getAssetCategory(asset: string): string | undefined {
    return this.assetCategories.get(asset.toUpperCase());
  }

  getAllKnownAssets(): string[] {
    return Array.from(this.assetCategories.keys());
  }
}

export const newsAssetMapper = new NewsAssetMapper();