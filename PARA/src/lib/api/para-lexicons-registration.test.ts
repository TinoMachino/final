import {BskyAgent} from '@atproto/api'

import {registerParaLexicons} from './para-lexicons-registration'

describe('registerParaLexicons', () => {
  it('registers timeline party and community params', () => {
    const agent = new BskyAgent({service: 'https://example.com'})

    registerParaLexicons(agent)

    const def = agent.lex.getDef('com.para.feed.getTimeline#main')
    expect(def).toMatchObject({
      type: 'query',
      parameters: {
        properties: {
          party: {type: 'string', maxLength: 128},
          community: {type: 'string', maxLength: 128},
        },
      },
    })
  })

  it('overwrites stale locally registered timeline params', () => {
    const agent = new BskyAgent({service: 'https://example.com'})
    agent.lex.add({
      lexicon: 1,
      id: 'com.para.feed.getTimeline',
      defs: {
        main: {
          type: 'query',
          parameters: {
            type: 'params',
            properties: {
              limit: {type: 'integer'},
            },
          },
          output: {
            encoding: 'application/json',
            schema: {type: 'object'},
          },
        },
      },
    })

    registerParaLexicons(agent)

    const def = agent.lex.getDef('com.para.feed.getTimeline#main')
    expect(def).toMatchObject({
      parameters: {
        properties: {
          party: {type: 'string', maxLength: 128},
          community: {type: 'string', maxLength: 128},
        },
      },
    })
  })
})
