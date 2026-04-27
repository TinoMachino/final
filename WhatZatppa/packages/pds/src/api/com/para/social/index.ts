// @ts-nocheck
import { AppContext } from '../../../../context'
import { Server } from '../../../../lexicon'
import getPostMeta from './getPostMeta'

export default function (server: Server, ctx: AppContext) {
  getPostMeta(server, ctx)
}
