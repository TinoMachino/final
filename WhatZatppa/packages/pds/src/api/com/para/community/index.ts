// @ts-nocheck
import { AppContext } from '../../../../context'
import { Server } from '../../../../lexicon'
import createBoard from './createBoard'
import getBoard from './getBoard'
import getGovernance from './getGovernance'
import listBoards from './listBoards'
import acceptDraftInvite from './acceptDraftInvite'
import join from './join'
import leave from './leave'

export default function (server: Server, ctx: AppContext) {
  createBoard(server, ctx)
  getBoard(server, ctx)
  getGovernance(server, ctx)
  listBoards(server, ctx)
  acceptDraftInvite(server, ctx)
  join(server, ctx)
  leave(server, ctx)
}
