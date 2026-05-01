import './env'
import { generateMinimalMockSetup } from './mock/minimal'
import { TestNetwork } from './network'
import { mockMailer } from './util'
import { paraDemoSeed } from './seed'

const envStr = (name: string): string | undefined => {
  const value = process.env[name]
  return value === undefined || value === '' ? undefined : value
}

const envInt = (name: string): number | undefined => {
  const value = envStr(name)
  return value === undefined ? undefined : Number.parseInt(value, 10)
}

const envBool = (name: string, defaultValue: boolean): boolean => {
  const value = envStr(name)
  if (value === undefined) return defaultValue
  return value === '1' || value.toLowerCase() === 'true'
}

const run = async () => {
  console.log(`
██████╗
██╔═══██╗
██║██╗██║
██║██║██║
╚█║████╔╝
 ╚╝╚═══╝  protocol

[ created by Bluesky ]`)

  const pdsPort = envInt('DEV_ENV_PDS_PORT') ?? 2583
  const bskyPort = envInt('DEV_ENV_BSKY_PORT') ?? 2584
  const plcPort = envInt('DEV_ENV_PLC_PORT') ?? 2582
  const chatPort = envInt('DEV_ENV_CHAT_PORT') ?? 2590
  const ozonePort = envInt('DEV_ENV_OZONE_PORT') ?? 2587
  const introspectPort = envInt('DEV_ENV_INTROSPECT_PORT') ?? 2581
  const hostname = envStr('DEV_ENV_PDS_HOSTNAME') ?? 'localhost'
  const bskyPublicUrl =
    envStr('DEV_ENV_BSKY_PUBLIC_URL') ?? `http://localhost:${bskyPort}`
  const dbPostgresSchema = envStr('DB_POSTGRES_SCHEMA') ?? 'dev'

  const network = await TestNetwork.create({
    dbPostgresSchema,
    pds: {
      port: pdsPort,
      hostname,
      enableDidDocWithSession: envBool(
        'DEV_ENV_ENABLE_DID_DOC_WITH_SESSION',
        true,
      ),
      dataDirectory: envStr('DEV_ENV_PDS_DATA_DIRECTORY'),
      blobstoreDiskLocation: envStr('DEV_ENV_PDS_BLOBSTORE_DIRECTORY'),
    },
    bsky: {
      port: bskyPort,
      publicUrl: bskyPublicUrl,
    },
    plc: { port: plcPort },
    chat: { port: chatPort },
    ozone: {
      port: ozonePort,
      dbMaterializedViewRefreshIntervalMs: 30_000,
    },
    introspect: { port: introspectPort },
  })
  mockMailer(network.pds)

  if (network.introspect) {
    console.log(
      `🔍 Dev-env introspection server http://localhost:${network.introspect.port}`,
    )
  }
  console.log(`👤 DID Placeholder server http://localhost:${network.plc.port}`)
  console.log(`🌞 Main PDS http://localhost:${network.pds.port}`)
  console.log(`🌞 Main PDS account DB`, network.pds.ctx.cfg.db.accountDbLoc)
  console.log(
    `🔨 Lexicon authority DID ${network.pds.ctx.cfg.lexicon.didAuthority}`,
  )
  console.log(`🗼 Ozone server http://localhost:${network.ozone.port}`)
  console.log(`🗼 Ozone service DID ${network.ozone.ctx.cfg.service.did}`)
  console.log(`💬 Chat service http://localhost:${network.chat.port}`)
  console.log(`💬 Chat service DID ${network.chat.did}`)
  console.log(`🌅 Bsky Appview http://localhost:${network.bsky.port}`)
  console.log(`🌅 Bsky Appview DID ${network.bsky.serverDid}`)
  for (const fg of network.feedGens) {
    console.log(`🤖 Feed Generator (${fg.did}) http://localhost:${fg.port}`)
  }

  if (!envBool('DEV_ENV_SKIP_MOCK_SETUP', false)) {
    await generateMinimalMockSetup(network)
  }

  if (!envBool('DEV_ENV_SKIP_PARA_DEMO_SEED', false)) {
    const sc = network.getSeedClient()
    await paraDemoSeed(sc)
  }

  console.log('✅ Dev environment is ready')
}

run()
