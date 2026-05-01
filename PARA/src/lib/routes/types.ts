import {type NavigationState, type PartialState} from '@react-navigation/native'
import {type NativeStackNavigationProp} from '@react-navigation/native-stack'

import {type VideoFeedSourceContext} from '#/screens/VideoFeed/types'

export type {NativeStackScreenProps} from '@react-navigation/native-stack'

export type CommonNavigatorParams = {
  NotFound: undefined
  Lists: undefined
  Moderation: undefined
  ModerationModlists: undefined
  ModerationMutedAccounts: undefined
  ModerationBlockedAccounts: undefined
  ModerationInteractionSettings: undefined
  ModerationVerificationSettings: undefined
  Settings: undefined
  Profile: {name: string; hideBackButton?: boolean}
  ProfileFollowers: {name: string}
  ProfileFollows: {name: string}
  ProfileKnownFollowers: {name: string}
  ProfileSearch: {name: string; q?: string}
  ProfileList: {name: string; rkey: string}
  PostThread: {name: string; rkey: string}
  PostLikedBy: {name: string; rkey: string}
  PostRepostedBy: {name: string; rkey: string}
  PostHighlights: {name: string; rkey: string}
  PostQuotes: {name: string; rkey: string}
  ProfileFeed: {
    name: string
    rkey: string
    feedCacheKey?: 'discover' | 'explore' | undefined
  }
  CommunitiesActiveIn: {name: string}
  ProfileFeedLikedBy: {name: string; rkey: string}
  ProfileLabelerLikedBy: {name: string}
  Debug: undefined
  DebugMod: undefined
  SharedPreferencesTester: undefined
  Log: undefined
  Support: undefined
  PrivacyPolicy: undefined
  TermsOfService: undefined
  CommunityGuidelines: undefined
  CopyrightPolicy: undefined
  LanguageSettings: undefined
  AppPasswords: undefined
  SavedFeeds: undefined
  PreferencesFollowingFeed: undefined
  PreferencesThreads: undefined
  PreferencesExternalEmbeds: undefined
  AccessibilitySettings: undefined
  AppearanceSettings: undefined
  AccountSettings: undefined
  ProfileVisibility: undefined
  PoliticalAffiliation: undefined
  SeeVotes: {did?: string}
  SeeInfluence: {did?: string}
  SeePosts: {did?: string}
  PrivacyAndSecuritySettings: undefined
  ActivityPrivacySettings: undefined
  ContentAndMediaSettings: undefined
  NotificationSettings: undefined
  ReplyNotificationSettings: undefined
  MentionNotificationSettings: undefined
  QuoteNotificationSettings: undefined
  LikeNotificationSettings: undefined
  RepostNotificationSettings: undefined
  NewFollowerNotificationSettings: undefined
  LikesOnRepostsNotificationSettings: undefined
  RepostsOnRepostsNotificationSettings: undefined
  ActivityNotificationSettings: undefined
  MiscellaneousNotificationSettings: undefined
  InterestsSettings: undefined
  AboutSettings: undefined
  AppIconSettings: undefined
  FindContactsSettings: undefined
  Search: {q?: string; tab?: 'user' | 'profile' | 'feed'}
  Hashtag: {tag: string; author?: string}
  Topic: {topic: string}
  MessagesConversation: {conversation: string; embed?: string; accept?: true}
  MessagesConversationSettings: {conversation: string}
  MessagesSettings: undefined
  MessagesInbox: undefined
  Messages: {pushToConversation?: string; animation?: 'push' | 'pop'}
  Communities: undefined
  MyCommunities: undefined
  CreateCommunity: undefined
  PoliciesDashboard: {
    filter?: 'Communities' | 'Parties' | 'Both'
    mode?: 'Policies' | 'Matters'
  }
  PolicyDetails: {item?: Record<string, unknown>; cabildeoUri?: string}
  Representatives: {category?: string; q?: string}
  NotificationsActivityList: {posts: string}
  LegacyNotificationSettings: undefined
  Feeds: undefined
  Start: {name: string; rkey: string}
  StarterPack: {name: string; rkey: string; new?: boolean}
  StarterPackShort: {code: string}
  StarterPackWizard: {
    fromDialog?: boolean
    targetDid?: string
    onSuccess?: () => void
  }
  StarterPackEdit: {rkey?: string}
  VideoFeed: VideoFeedSourceContext
  Bookmarks: undefined
  FindContactsFlow: undefined
  MemesAndDocuments: {mode?: 'Memes' | 'Documents'; view?: 'board' | 'deck'}
  DiscourseAnalysis: undefined
  VSScreenV2: {entities?: string[]; matter?: string}
  AgentChat: {agentId: string}
  CommunityAgentProfile: {agentId: string; communityName?: string}
  RAQ: undefined
  MyRAQ: undefined
  RAQAssessment: undefined
  ProposedRAQList: undefined
  OpenQuestionsList: undefined
  AxesDiscoveryList: {initialTab?: 'official' | 'unofficial'}
  RAQResults: {results: Record<string, unknown>[]}
  OpenQuestionThread: {id: string}
  CommunityRAQ: {communityId: string; communityName: string}
  CommunityVoters: {communityId: string; communityName: string}
  CommunityRoles: {communityId: string; communityName: string}
  Highlights: undefined
  SeeHighlightDetails: {highlightId: string}
  Map: undefined
  Compass:
    | {
        initialZoom?: '9ths' | '25ths' | '69ths'
        highlightNinth?: string
        mode?: 'explore' | 'affiliate'
      }
    | undefined
  CabildeoList: {communityId?: string; communityName?: string} | undefined
  CabildeoDetail: {cabildeoUri: string}
  DelegateVote: {cabildeoUri: string}
  CreateCabildeo: undefined
  CreatePosition: {cabildeoUri: string; optionIndex?: number}
  DistrictProfile: {districtId: number; initialTab?: 'overview' | 'activity'}
}

export type BottomTabNavigatorParams = CommonNavigatorParams & {
  HomeTab: undefined
  SearchTab: undefined
  NotificationsTab: {screen?: string; params?: object} | undefined
  MyProfileTab: undefined
  BaseTab: undefined
}

export type HomeTabNavigatorParams = CommonNavigatorParams & {
  Home: undefined
}

export type SearchTabNavigatorParams = CommonNavigatorParams & {
  Search: {q?: string; tab?: 'user' | 'profile' | 'feed'}
}

export type NotificationsTabNavigatorParams = CommonNavigatorParams & {
  Notifications: undefined
}

export type MyProfileTabNavigatorParams = CommonNavigatorParams & {
  MyProfile: {name: 'me'; hideBackButton: true}
}

export type BaseTabNavigatorParams = CommonNavigatorParams & {
  Base: undefined
  MyBase: undefined
  MyCommunities: undefined
  MyRAQ: undefined
  MyAffiliations: undefined
  CommunityProfile: {communityId: string; communityName: string}
  CommunityRoles: {communityId: string; communityName: string}
  PoliciesDashboard: {
    filter?: 'Communities' | 'Parties' | 'Both'
    mode?: 'Policies' | 'Matters'
  }
  PolicyDetails: {item?: Record<string, unknown>; cabildeoUri?: string}
  MemesAndDocuments: {mode?: 'Memes' | 'Documents'; view?: 'board' | 'deck'}
  DistrictProfile: {districtId: number; initialTab?: 'overview' | 'activity'}
}

export type FlatNavigatorParams = CommonNavigatorParams & {
  Home: undefined
  Search: {q?: string; tab?: 'user' | 'profile' | 'feed'}
  Feeds: undefined
  Notifications: undefined
  CommunityProfile: {communityId: string; communityName: string}
  CommunityRoles: {communityId: string; communityName: string}
  PoliciesDashboard: {
    filter?: 'Communities' | 'Parties' | 'Both'
    mode?: 'Policies' | 'Matters'
  }
  PolicyDetails: {item?: Record<string, unknown>; cabildeoUri?: string}
  Representatives: {category?: string; q?: string}
  Base: undefined
  CreatePost: undefined
  MyBase: undefined
  MyAffiliations: undefined
  MemesAndDocuments: {mode?: 'Memes' | 'Documents'; view?: 'board' | 'deck'}
  RAQ: undefined
  ProposedRAQList: undefined
  OpenQuestionsList: undefined
  AxesDiscoveryList: {initialTab?: 'official' | 'unofficial'}
  RAQResults: {results: Record<string, unknown>[]}
  OpenQuestionThread: {id: string}
}

export type AllNavigatorParams = CommonNavigatorParams & {
  HomeTab: undefined
  Home: undefined
  PoliciesDashboard: {
    filter?: 'Communities' | 'Parties' | 'Both'
    mode?: 'Policies' | 'Matters'
  }
  PolicyDetails: {item?: Record<string, unknown>; cabildeoUri?: string}
  Representatives: {category?: string; q?: string}
  SearchTab: undefined
  Search: {q?: string; tab?: 'user' | 'profile' | 'feed'}
  Feeds: undefined
  NotificationsTab: {screen?: string; params?: object} | undefined
  Notifications: undefined
  MyProfileTab: undefined
  BaseTab: undefined
  Base: undefined
  MyBase: undefined
  MyAffiliations: undefined
  CreatePost: undefined
  CommunityProfile: {communityId: string; communityName: string}
  CommunityRoles: {communityId: string; communityName: string}
  RAQ: undefined
  OpenQuestionsList: undefined
  AxesDiscoveryList: {initialTab?: 'official' | 'unofficial'}
  RAQResults: {results: Record<string, unknown>[]}
  OpenQuestionThread: {id: string}
  Highlights: undefined
  SeeHighlightDetails: {highlightId: string}
}

export type RootStackParams = {
  Tabs: undefined
  CreatePost: undefined
}

// NOTE
// this isn't strictly correct but it should be close enough
// a TS wizard might be able to get this 100%
// -prf
export type NavigationProp = NativeStackNavigationProp<AllNavigatorParams>

export type State =
  | NavigationState
  | Omit<PartialState<NavigationState>, 'stale'>

export type RouteParams = Record<string, string>
export type MatchResult = {params: RouteParams}
export type Route = {
  match: (path: string) => MatchResult | undefined
  build: (params?: Record<string, string>) => string
}
