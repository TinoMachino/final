import {type AppBskyFeedDefs, AtUri} from '@atproto/api'

export type OpenQuestionListItem = {
  id: string
  text: string
  author: {
    handle: string
    avatar: string
  }
  replyCount: number
  timestamp: string
}

export function mapOpenQuestionPosts(
  posts: AppBskyFeedDefs.PostView[],
): OpenQuestionListItem[] {
  return posts.map(post => ({
    id: post.uri,
    text:
      (post.record as {text?: string})?.text?.replace(
        /\|#\?OpenQuestion/g,
        '',
      ) || '',
    author: {
      handle: post.author.handle,
      avatar: post.author.avatar || '',
    },
    replyCount: post.replyCount || 0,
    timestamp: post.indexedAt,
  }))
}

export function toPostThreadParamsFromUri(uri: string) {
  try {
    const parsed = new AtUri(uri)
    return {name: parsed.host, rkey: parsed.rkey}
  } catch {
    return null
  }
}
