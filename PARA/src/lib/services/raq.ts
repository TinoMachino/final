/**
 * RAQ (Rapid Answer Questions) Service
 *
 * Handles fetching RAQ questions, axes, and proposals.
 */

import {
  type CommunityAxis,
  type OpenQuestion,
  type ProposedQuestion,
  type RAQAxisSection,
} from '#/lib/mock-data'
import {
  COMMUNITY_AXES,
  OPEN_QUESTIONS,
  PROPOSED_QUESTIONS,
  RAQ_AXES,
} from '#/lib/mock-data'
import {USE_MOCK_DATA} from './config'
import {type PaginationParams, type ServiceResponse} from './types'

/**
 * Fetch open RAQ questions
 */
export async function fetchOpenQuestions(
  params?: PaginationParams,
): Promise<ServiceResponse<OpenQuestion[]>> {
  if (USE_MOCK_DATA) {
    await simulateNetworkDelay()

    const limit = params?.limit || 20
    const data = OPEN_QUESTIONS.slice(0, limit)

    return {data, cursor: data.length >= limit ? 'next-page' : undefined}
  }

  throw new Error('Real API not yet implemented for RAQ open questions')
}

/**
 * Fetch a single open question by ID
 */
export async function fetchOpenQuestionById(
  id: string,
): Promise<OpenQuestion | null> {
  if (USE_MOCK_DATA) {
    await simulateNetworkDelay()
    return OPEN_QUESTIONS.find(q => q.id === id) || null
  }

  throw new Error('Real API not yet implemented for RAQ open questions')
}

/**
 * Fetch proposed RAQ questions
 */
export async function fetchProposedQuestions(
  params?: PaginationParams,
): Promise<ServiceResponse<ProposedQuestion[]>> {
  if (USE_MOCK_DATA) {
    await simulateNetworkDelay()

    const limit = params?.limit || 20
    const data = PROPOSED_QUESTIONS.slice(0, limit)

    return {data, cursor: data.length >= limit ? 'next-page' : undefined}
  }

  throw new Error('Real API not yet implemented for RAQ proposed questions')
}

/**
 * Fetch official RAQ axes
 */
export async function fetchRAQAxes(): Promise<RAQAxisSection[]> {
  if (USE_MOCK_DATA) {
    await simulateNetworkDelay()
    return RAQ_AXES
  }

  throw new Error('Real API not yet implemented for RAQ axes')
}

/**
 * Fetch community-created axes
 */
export async function fetchCommunityAxes(): Promise<CommunityAxis[]> {
  if (USE_MOCK_DATA) {
    await simulateNetworkDelay()
    return COMMUNITY_AXES
  }

  throw new Error('Real API not yet implemented for community axes')
}

function simulateNetworkDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 100))
}

/**
 * Submit a new open question
 */
export async function submitOpenQuestion(text: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await simulateNetworkDelay()
    const newQuestion: OpenQuestion = {
      id: `open_${Date.now()}`,
      text,
      author: {
        handle: 'me.test',
        avatar: '', // TODO: get from session
      },
      replyCount: 0,
      timestamp: 'Just now',
    }
    // Prepend to mock data
    OPEN_QUESTIONS.unshift(newQuestion)
    return
  }
  throw new Error('Real API not yet implemented for submitting RAQ')
}

/**
 * Submit a new proposed question (proposal)
 */
export async function submitProposedQuestion(text: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await simulateNetworkDelay()
    const newProposal: ProposedQuestion = {
      id: `prop_${Date.now()}`,
      text,
      upvotes: 0,
      downvotes: 0,
      isMainstream: false,
      viewerHasUpvoted: false,
      viewerHasDownvoted: false,
    }
    PROPOSED_QUESTIONS.unshift(newProposal)
    return
  }
  throw new Error('Real API not yet implemented for submitting proposal')
}

/**
 * Vote on a proposed question
 */
export async function voteOnProposedQuestion(
  id: string,
  direction: 'up' | 'down',
): Promise<void> {
  if (USE_MOCK_DATA) {
    await simulateNetworkDelay()
    const item = PROPOSED_QUESTIONS.find(q => q.id === id)
    if (item) {
      // Remove existing vote if any
      if (item.viewerHasUpvoted) item.upvotes--
      if (item.viewerHasDownvoted) item.downvotes--

      // Toggle off if clicking same direction, else apply new vote
      if (direction === 'up') {
        if (item.viewerHasUpvoted) {
          item.viewerHasUpvoted = false
        } else {
          item.viewerHasUpvoted = true
          item.upvotes++
          item.viewerHasDownvoted = false
        }
      } else {
        if (item.viewerHasDownvoted) {
          item.viewerHasDownvoted = false
        } else {
          item.viewerHasDownvoted = true
          item.downvotes++
          item.viewerHasUpvoted = false
        }
      }
    }
    return
  }
  throw new Error('Real API not yet implemented for voting on proposal')
}

/**
 * Vote on a community axis
 */
export async function voteOnCommunityAxis(id: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await simulateNetworkDelay()
    const item = COMMUNITY_AXES.find(a => a.id === id)
    if (item) {
      if (item.viewerHasVoted) {
        item.viewerHasVoted = false
        item.votes--
      } else {
        item.viewerHasVoted = true
        item.votes++
      }
    }
    return
  }
  throw new Error('Real API not yet implemented for voting on axis')
}
