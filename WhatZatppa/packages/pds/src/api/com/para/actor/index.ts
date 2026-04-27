// @ts-nocheck
import { AppContext } from '../../../../context'
import { Server } from '../../../../lexicon'
import getProfileStats from './getProfileStats'

export default function (server: Server, ctx: AppContext) {
  getProfileStats(server, ctx)
}
