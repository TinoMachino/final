import {type AtpAgent} from '@atproto/api'

import {
  type DiscourseSnapshot,
  type SentimentDistribution,
  type TopicCluster,
} from './para-lexicons'

export class DiscourseAPI {
  constructor(public agent: AtpAgent) {}

  async getSnapshot(params: {
    community?: string
    timeframe: '1h' | '24h' | '7d' | '30d'
  }): Promise<DiscourseSnapshot[]> {
    const res = await (this.agent.api.com as any).para.discourse.getSnapshot(params)
    return res.data.snapshots
  }

  async getTopics(params: {
    community?: string
    timeframe: '1h' | '24h' | '7d' | '30d'
  }): Promise<TopicCluster[]> {
    const res = await (this.agent.api.com as any).para.discourse.getTopics(params)
    return res.data.topics
  }

  async getSentiment(params: {
    community?: string
    timeframe: '1h' | '24h' | '7d' | '30d'
  }): Promise<SentimentDistribution> {
    const res = await (this.agent.api.com as any).para.discourse.getSentiment(params)
    return res.data.sentiment
  }
}
