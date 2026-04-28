import {type BskyAgent} from '@atproto/api'

/**
 * Para Lexicon Registration
 *
 * The published @atproto/api npm package does not include PARA's custom
 * lexicons (com.para.*).  agent.call() validates every method against the
 * agent's internal Lexicons collection and throws "Lexicon not found" if the
 * schema is missing.  This helper registers all PARA lexicons at runtime so
 * civic and community XRPC calls work in the PARA app.
 */

// ─── Civic ───────────────────────────────────────────────────────────────────

const listCabildeos = {
  lexicon: 1,
  id: 'com.para.civic.listCabildeos',
  defs: {
    main: {
      type: 'query' as const,
      description:
        'List indexed Cabildeos with aggregate summaries and optional viewer context.',
      parameters: {
        type: 'params' as const,
        properties: {
          community: {
            type: 'string' as const,
            maxLength: 100,
          },
            phase: {
              type: 'string',
              enum: ['draft', 'open', 'deliberating', 'voting', 'resolved'],
            },
          limit: {
            type: 'integer' as const,
            minimum: 1,
            maximum: 100,
            default: 30,
          },
          cursor: {type: 'string' as const},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          required: ['cabildeos'],
          properties: {
            cursor: {type: 'string' as const},
            cabildeos: {
              type: 'array' as const,
              items: {type: 'ref' as const, ref: 'lex:com.para.civic.defs#cabildeoView'},
            },
          },
        },
      },
    },
  },
}

const getCabildeo = {
  lexicon: 1,
  id: 'com.para.civic.getCabildeo',
  defs: {
    main: {
      type: 'query' as const,
      description: 'Get a single Cabildeo with full viewer context.',
      parameters: {
        type: 'params' as const,
        properties: {
          cabildeo: {type: 'string' as const, format: 'at-uri'},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            cabildeo: {type: 'ref' as const, ref: 'lex:com.para.civic.defs#cabildeoView'},
          },
        },
      },
    },
  },
}

const listCabildeoPositions = {
  lexicon: 1,
  id: 'com.para.civic.listCabildeoPositions',
  defs: {
    main: {
      type: 'query' as const,
      description: 'List positions on a Cabildeo.',
      parameters: {
        type: 'params' as const,
        properties: {
          cabildeo: {type: 'string' as const, format: 'at-uri'},
          stance: {
            type: 'string' as const,
            knownValues: ['for', 'against', 'amendment'],
          },
          limit: {
            type: 'integer' as const,
            minimum: 1,
            maximum: 100,
            default: 30,
          },
          cursor: {type: 'string' as const},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          required: ['positions'],
          properties: {
            cursor: {type: 'string' as const},
            positions: {
              type: 'array' as const,
              items: {type: 'ref' as const, ref: 'lex:com.para.civic.defs#positionView'},
            },
          },
        },
      },
    },
  },
}

const listDelegationCandidates = {
  lexicon: 1,
  id: 'com.para.civic.listDelegationCandidates',
  defs: {
    main: {
      type: 'query' as const,
      description: 'List eligible delegation candidates for a Cabildeo.',
      parameters: {
        type: 'params' as const,
        properties: {
          cabildeo: {type: 'string' as const, format: 'at-uri'},
          communityId: {type: 'string' as const},
          limit: {
            type: 'integer' as const,
            minimum: 1,
            maximum: 100,
            default: 50,
          },
          cursor: {type: 'string' as const},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          required: ['candidates'],
          properties: {
            cursor: {type: 'string' as const},
            candidates: {type: 'array' as const, items: {type: 'unknown' as const}},
          },
        },
      },
    },
  },
}

const castVote = {
  lexicon: 1,
  id: 'com.para.civic.castVote',
  defs: {
    main: {
      type: 'procedure' as const,
      description: 'Cast a vote on a Cabildeo.',
      input: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          required: ['cabildeo', 'selectedOption'],
          properties: {
            cabildeo: {type: 'string' as const, format: 'at-uri'},
            selectedOption: {type: 'integer' as const, minimum: 0},
          },
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            uri: {type: 'string' as const, format: 'at-uri'},
            cid: {type: 'string' as const, format: 'cid'},
            commit: {
              type: 'object' as const,
              properties: {
                cid: {type: 'string' as const, format: 'cid'},
                rev: {type: 'string' as const},
              },
            },
          },
        },
      },
    },
  },
}

const putLivePresence = {
  lexicon: 1,
  id: 'com.para.civic.putLivePresence',
  defs: {
    main: {
      type: 'procedure' as const,
      description: 'Report live presence for a Cabildeo session.',
      input: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          required: ['cabildeoUri', 'actorDid', 'sessionId', 'present'],
          properties: {
            cabildeoUri: {type: 'string' as const, format: 'at-uri'},
            actorDid: {type: 'string' as const, format: 'did'},
            sessionId: {type: 'string' as const},
            present: {type: 'boolean' as const},
            hostLiveUri: {type: 'string' as const, format: 'uri'},
          },
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          required: ['cabildeoUri', 'present'],
          properties: {
            cabildeoUri: {type: 'string' as const, format: 'at-uri'},
            present: {type: 'boolean' as const},
            expiresAt: {type: 'string' as const, format: 'datetime'},
          },
        },
      },
    },
  },
}

const getPolicyTally = {
  lexicon: 1,
  id: 'com.para.civic.getPolicyTally',
  defs: {
    main: {
      type: 'query' as const,
      description: 'Get policy tally for a subject.',
      parameters: {
        type: 'params' as const,
        properties: {
          subject: {type: 'string' as const, format: 'at-uri'},
          subjectType: {type: 'string' as const},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            tally: {type: 'ref' as const, ref: 'lex:com.para.civic.defs#policyTally'},
          },
        },
      },
    },
  },
}

// ─── Community ─────────────────────────────────────────────────────────────────

const listBoards = {
  lexicon: 1,
  id: 'com.para.community.listBoards',
  defs: {
    main: {
      type: 'query' as const,
      parameters: {
        type: 'params' as const,
        properties: {
          limit: {type: 'integer' as const, minimum: 1, maximum: 100, default: 12},
          query: {type: 'string' as const},
          state: {type: 'string' as const},
          quadrant: {type: 'string' as const},
          participationKind: {type: 'string' as const},
          flairId: {type: 'string' as const},
          sort: {type: 'string' as const},
          cursor: {type: 'string' as const},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            cursor: {type: 'string' as const},
            boards: {type: 'array' as const, items: {type: 'unknown' as const}},
          },
        },
      },
    },
  },
}

const listMembers = {
  lexicon: 1,
  id: 'com.para.community.listMembers',
  defs: {
    main: {
      type: 'query' as const,
      parameters: {
        type: 'params' as const,
        properties: {
          communityId: {type: 'string' as const},
          limit: {type: 'integer' as const, minimum: 1, maximum: 100, default: 50},
          membershipState: {type: 'string' as const},
          role: {type: 'string' as const},
          sort: {type: 'string' as const},
          cursor: {type: 'string' as const},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            cursor: {type: 'string' as const},
            members: {type: 'array' as const, items: {type: 'unknown' as const}},
          },
        },
      },
    },
  },
}

const getBoard = {
  lexicon: 1,
  id: 'com.para.community.getBoard',
  defs: {
    main: {
      type: 'query' as const,
      parameters: {
        type: 'params' as const,
        properties: {
          communityId: {type: 'string' as const},
          uri: {type: 'string' as const, format: 'at-uri'},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            board: {type: 'unknown' as const},
          },
        },
      },
    },
  },
}

const createBoard = {
  lexicon: 1,
  id: 'com.para.community.createBoard',
  defs: {
    main: {
      type: 'procedure' as const,
      input: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            name: {type: 'string' as const},
            slug: {type: 'string' as const},
            description: {type: 'string' as const},
            quadrant: {type: 'string' as const},
            participationKind: {type: 'string' as const},
            officialRepresentatives: {type: 'array' as const, items: {type: 'unknown' as const}},
            matterFlairIds: {type: 'array' as const, items: {type: 'string' as const}},
            policyFlairIds: {type: 'array' as const, items: {type: 'string' as const}},
          },
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            uri: {type: 'string' as const, format: 'at-uri'},
            cid: {type: 'string' as const, format: 'cid'},
          },
        },
      },
    },
  },
}

const joinCommunity = {
  lexicon: 1,
  id: 'com.para.community.join',
  defs: {
    main: {
      type: 'procedure' as const,
      input: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          required: ['communityId'],
          properties: {
            communityId: {type: 'string' as const},
            roles: {type: 'array' as const, items: {type: 'string' as const}},
          },
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            uri: {type: 'string' as const, format: 'at-uri'},
            cid: {type: 'string' as const, format: 'cid'},
            communityUri: {type: 'string' as const, format: 'at-uri'},
            membershipState: {type: 'string' as const},
            viewerCapabilities: {type: 'array' as const, items: {type: 'string' as const}},
          },
        },
      },
    },
  },
}

const leaveCommunity = {
  lexicon: 1,
  id: 'com.para.community.leave',
  defs: {
    main: {
      type: 'procedure' as const,
      input: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          required: ['communityId'],
          properties: {
            communityId: {type: 'string' as const},
          },
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            uri: {type: 'string' as const, format: 'at-uri'},
            cid: {type: 'string' as const, format: 'cid'},
            membershipState: {type: 'string' as const},
          },
        },
      },
    },
  },
}

const getGovernance = {
  lexicon: 1,
  id: 'com.para.community.getGovernance',
  defs: {
    main: {
      type: 'query' as const,
      parameters: {
        type: 'params' as const,
        properties: {
          communityId: {type: 'string' as const},
          uri: {type: 'string' as const, format: 'at-uri'},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            governance: {type: 'unknown' as const},
          },
        },
      },
    },
  },
}

const listPosts = {
  lexicon: 1,
  id: 'com.para.community.listPosts',
  defs: {
    main: {
      type: 'query' as const,
      parameters: {
        type: 'params' as const,
        properties: {
          communityId: {type: 'string' as const},
          limit: {type: 'integer' as const, minimum: 1, maximum: 100, default: 30},
          cursor: {type: 'string' as const},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            cursor: {type: 'string' as const},
            posts: {type: 'array' as const, items: {type: 'unknown' as const}},
          },
        },
      },
    },
  },
}

const acceptDraftInvite = {
  lexicon: 1,
  id: 'com.para.community.acceptDraftInvite',
  defs: {
    main: {
      type: 'procedure' as const,
      input: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          required: ['communityId', 'inviteToken'],
          properties: {
            communityId: {type: 'string' as const},
            inviteToken: {type: 'string' as const},
          },
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            uri: {type: 'string' as const, format: 'at-uri'},
            cid: {type: 'string' as const, format: 'cid'},
            membershipState: {type: 'string' as const},
          },
        },
      },
    },
  },
}

// ─── Discourse ─────────────────────────────────────────────────────────────────

const getSnapshot = {
  lexicon: 1,
  id: 'com.para.discourse.getSnapshot',
  defs: {
    main: {
      type: 'query' as const,
      parameters: {
        type: 'params' as const,
        properties: {
          community: {type: 'string' as const},
          timeframe: {type: 'string' as const},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            snapshot: {type: 'unknown' as const},
          },
        },
      },
    },
  },
}

const getSentiment = {
  lexicon: 1,
  id: 'com.para.discourse.getSentiment',
  defs: {
    main: {
      type: 'query' as const,
      parameters: {
        type: 'params' as const,
        properties: {
          community: {type: 'string' as const},
          timeframe: {type: 'string' as const},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            sentiment: {type: 'unknown' as const},
          },
        },
      },
    },
  },
}

const getTopics = {
  lexicon: 1,
  id: 'com.para.discourse.getTopics',
  defs: {
    main: {
      type: 'query' as const,
      parameters: {
        type: 'params' as const,
        properties: {
          community: {type: 'string' as const},
          timeframe: {type: 'string' as const},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            topics: {type: 'array' as const, items: {type: 'unknown' as const}},
          },
        },
      },
    },
  },
}

// ─── Feed ──────────────────────────────────────────────────────────────────────

const getAuthorFeed = {
  lexicon: 1,
  id: 'com.para.feed.getAuthorFeed',
  defs: {
    main: {
      type: 'query' as const,
      parameters: {
        type: 'params' as const,
        properties: {
          actor: {type: 'string' as const, format: 'did'},
          limit: {type: 'integer' as const, minimum: 1, maximum: 100, default: 30},
          cursor: {type: 'string' as const},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            cursor: {type: 'string' as const},
            feed: {type: 'array' as const, items: {type: 'unknown' as const}},
          },
        },
      },
    },
  },
}

const getPostThread = {
  lexicon: 1,
  id: 'com.para.feed.getPostThread',
  defs: {
    main: {
      type: 'query' as const,
      parameters: {
        type: 'params' as const,
        properties: {
          uri: {type: 'string' as const, format: 'at-uri'},
          depth: {type: 'integer' as const},
          parentHeight: {type: 'integer' as const},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            thread: {type: 'unknown' as const},
          },
        },
      },
    },
  },
}

const getPosts = {
  lexicon: 1,
  id: 'com.para.feed.getPosts',
  defs: {
    main: {
      type: 'query' as const,
      parameters: {
        type: 'params' as const,
        properties: {
          uris: {type: 'array' as const, items: {type: 'string' as const, format: 'at-uri'}},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            posts: {type: 'array' as const, items: {type: 'unknown' as const}},
          },
        },
      },
    },
  },
}

const getTimeline = {
  lexicon: 1,
  id: 'com.para.feed.getTimeline',
  defs: {
    main: {
      type: 'query' as const,
      parameters: {
        type: 'params' as const,
        properties: {
          algorithm: {type: 'string' as const},
          limit: {type: 'integer' as const, minimum: 1, maximum: 100, default: 30},
          cursor: {type: 'string' as const},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            cursor: {type: 'string' as const},
            feed: {type: 'array' as const, items: {type: 'unknown' as const}},
          },
        },
      },
    },
  },
}

// ─── Actor / Profile Stats ───────────────────────────────────────────────────

const getProfileStats = {
  lexicon: 1,
  id: 'com.para.actor.getProfileStats',
  defs: {
    main: {
      type: 'query' as const,
      parameters: {
        type: 'params' as const,
        properties: {
          actor: {type: 'string' as const, format: 'did'},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            stats: {type: 'unknown' as const},
          },
        },
      },
    },
  },
}

// ─── Social ────────────────────────────────────────────────────────────────────

const getPostMeta = {
  lexicon: 1,
  id: 'com.para.social.getPostMeta',
  defs: {
    main: {
      type: 'query' as const,
      parameters: {
        type: 'params' as const,
        properties: {
          uri: {type: 'string' as const, format: 'at-uri'},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            meta: {type: 'unknown' as const},
          },
        },
      },
    },
  },
}

// ─── Notification ─────────────────────────────────────────────────────────────

const getPostSubscription = {
  lexicon: 1,
  id: 'com.para.notification.getPostSubscription',
  defs: {
    main: {
      type: 'query' as const,
      parameters: {
        type: 'params' as const,
        properties: {
          uri: {type: 'string' as const, format: 'at-uri'},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            subscribed: {type: 'boolean' as const},
          },
        },
      },
    },
  },
}

const putPostSubscription = {
  lexicon: 1,
  id: 'com.para.notification.putPostSubscription',
  defs: {
    main: {
      type: 'procedure' as const,
      input: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          required: ['uri', 'subscribed'],
          properties: {
            uri: {type: 'string' as const, format: 'at-uri'},
            subscribed: {type: 'boolean' as const},
          },
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            subscribed: {type: 'boolean' as const},
          },
        },
      },
    },
  },
}

// ─── Highlight ─────────────────────────────────────────────────────────────────

const getHighlight = {
  lexicon: 1,
  id: 'com.para.highlight.getHighlight',
  defs: {
    main: {
      type: 'query' as const,
      parameters: {
        type: 'params' as const,
        properties: {
          uri: {type: 'string' as const, format: 'at-uri'},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            highlight: {type: 'unknown' as const},
          },
        },
      },
    },
  },
}

const listHighlights = {
  lexicon: 1,
  id: 'com.para.highlight.listHighlights',
  defs: {
    main: {
      type: 'query' as const,
      parameters: {
        type: 'params' as const,
        properties: {
          subjectUri: {type: 'string' as const, format: 'at-uri'},
          limit: {type: 'integer' as const, minimum: 1, maximum: 100, default: 30},
          cursor: {type: 'string' as const},
        },
      },
      output: {
        encoding: 'application/json' as const,
        schema: {
          type: 'object' as const,
          properties: {
            cursor: {type: 'string' as const},
            highlights: {type: 'array' as const, items: {type: 'unknown' as const}},
          },
        },
      },
    },
  },
}

// ─── Registration ────────────────────────────────────────────────────────────

const ALL_PARA_LEXICONS = [
  // Civic
  listCabildeos,
  getCabildeo,
  listCabildeoPositions,
  listDelegationCandidates,
  castVote,
  putLivePresence,
  getPolicyTally,
  // Community
  listBoards,
  listMembers,
  getBoard,
  createBoard,
  joinCommunity,
  leaveCommunity,
  getGovernance,
  listPosts,
  acceptDraftInvite,
  // Discourse
  getSnapshot,
  getSentiment,
  getTopics,
  // Feed
  getAuthorFeed,
  getPostThread,
  getPosts,
  getTimeline,
  // Actor
  getProfileStats,
  // Social
  getPostMeta,
  // Notification
  getPostSubscription,
  putPostSubscription,
  // Highlight
  getHighlight,
  listHighlights,
]

/**
 * Register all PARA custom lexicons on the given agent so that
 * agent.call('com.para.*', ...) works at runtime.
 */
export function registerParaLexicons(agent: BskyAgent) {
  for (const lex of ALL_PARA_LEXICONS) {
    try {
      // @ts-ignore — lex is plain JSON, Lexicons.add expects LexiconDoc
      agent.lex.add(lex)
    } catch (e: any) {
      // Already registered or schema mismatch — ignore
      if (!e?.message?.includes('already registered')) {
        console.warn(`[para-lexicons] Failed to register ${lex.id}:`, e?.message)
      }
    }
  }
}
