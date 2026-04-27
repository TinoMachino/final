import { AppContext } from '../context'
import { Server } from '@atproto/xrpc-server'
import {
  ComParaNS,
  Server as ParaLexiconServer,
} from '../lexicon'
import { schemas as paraSchemas } from '../lexicon/lexicons'
import appBsky from './app/bsky'
import comAtproto from './com/atproto'
import comPara from './com/para'

export default function (server: Server, ctx: AppContext) {
  server.addLexicons(paraSchemas)
  comAtproto(server, ctx)
  const paraServer = { xrpc: server } as ParaLexiconServer
  ;(paraServer as any).com = { para: new ComParaNS(paraServer) }
  comPara(paraServer, ctx)
  appBsky(server, ctx)
  return server
}
