// @ts-nocheck
import { AppContext } from '../../../../context'
import { Server } from '../../../../lexicon'
import castVote from './castVote'

export default function (server: Server, ctx: AppContext) {
  castVote(server, ctx)
}
