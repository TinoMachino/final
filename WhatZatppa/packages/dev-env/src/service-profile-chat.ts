import * as plc from '@did-plc/lib'
import { Secp256k1Keypair } from '@atproto/crypto'

// Static dev-only key so the local chat service publishes a stable DID.
// This is a hex-encoded secp256k1 private key because Secp256k1Keypair.import()
// expects hex strings in this workspace.
const DEV_CHAT_PRIVATE_KEY =
  '4f1de6ce4c3e8b25d4b91b7e7a0f0ad83e6f1e4cb51f2fe4d7d1c8f85d36f2ae'

export class ChatServiceProfile {
  constructor(
    readonly did: string,
    readonly key: Secp256k1Keypair,
    readonly publicUrl: string,
  ) {}

  static async create(opts: {
    plcUrl: string
    publicUrl: string
    handle?: string
    privateKey?: string
  }) {
    const plcClient = new plc.Client(opts.plcUrl)
    const key = await Secp256k1Keypair.import(
      opts.privateKey ?? DEV_CHAT_PRIVATE_KEY,
    )
    const handle = opts.handle ?? 'chat.test'

    const plcOp = await plc.signOperation(
      {
        type: 'plc_operation',
        rotationKeys: [key.did()],
        alsoKnownAs: [`at://${handle}`],
        verificationMethods: {
          atproto: key.did(),
        },
        services: {
          bsky_chat: {
            type: 'BskyChatService',
            endpoint: opts.publicUrl,
          },
        },
        prev: null,
      },
      key,
    )
    const did = await plc.didForCreateOp(plcOp)

    try {
      await plcClient.getDocument(did)
    } catch {
      await plcClient.sendOperation(did, plcOp)
    }

    await plcClient.updateData(did, key, (doc) => {
      doc.alsoKnownAs = [`at://${handle}`]
      doc.verificationMethods = {
        ...(doc.verificationMethods ?? {}),
        atproto: key.did(),
      }
      doc.services = {
        ...(doc.services ?? {}),
        bsky_chat: {
          type: 'BskyChatService',
          endpoint: opts.publicUrl,
        },
      }
      return doc
    })

    return new ChatServiceProfile(did, key, opts.publicUrl)
  }
}
