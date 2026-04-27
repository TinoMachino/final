// @ts-nocheck
import { AppContext } from '../../../../context'
import { Server } from '../../../../lexicon'
import getAuthorFeed from './getAuthorFeed'
import getPostThread from './getPostThread'
import getPosts from './getPosts'
import getTimeline from './getTimeline'

export default function (server: Server, ctx: AppContext) {
  getAuthorFeed(server, ctx)
  getPostThread(server, ctx)
  getPosts(server, ctx)
  getTimeline(server, ctx)
}
