import {StyleSheet, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useRoute} from '@react-navigation/native'

import {usePalette} from '#/lib/hooks/usePalette'
import {Text} from '#/view/com/util/text/Text'
import {useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Layout from '#/components/Layout'
import {RedditVoteButton} from '#/components/PostControls/VoteButton'
import {AddRAQDialog} from '../RAQ/components/AddRAQDialog'

export function CommunityRAQScreen() {
  const pal = usePalette('default')
  const t = useTheme()
  const {_} = useLingui()
  const route = useRoute<any>()
  const {communityName = 'Community'} = route.params || {}

  const addDialogControl = Dialog.useDialogControl()

  // Mock data for RAQappends
  const appends = [
    {
      id: '1',
      title: 'Should the community prioritize local renewable energy?',
      votes: 120,
    },
    {
      id: '2',
      title: 'Proposal to increase community garden space',
      votes: 85,
    },
    {
      id: '3',
      title: 'New policy for community event funding',
      votes: 64,
    },
  ]

  // Mock data for Voters

  const _voters = 234 // Placeholder

  return (
    <Layout.Screen style={[pal.view, pal.border]}>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>{communityName} RAQ</Layout.Header.TitleText>
        </Layout.Header.Content>
        <Button
          label={_(msg`Add`)}
          size="small"
          variant="solid"
          color="primary"
          onPress={() => addDialogControl.open()}>
          <ButtonText>
            <Trans>Add</Trans>
          </ButtonText>
        </Button>
      </Layout.Header.Outer>

      <Layout.Content
        style={styles.container}
        contentContainerStyle={{
          padding: 16,
        }}>
        {/* OFFICIAL VALUES */}
        <View style={[styles.section]}>
          <Text style={[styles.sectionTitle, pal.text]}>
            <Trans>Official Appends</Trans>
          </Text>
          <Text style={[pal.textLight, {marginBottom: 12}]}>
            <Trans>Community alignment on official axes.</Trans>
          </Text>
          <View style={[styles.item, pal.border]}>
            <Text style={[pal.text, {fontWeight: '500'}]}>Economic</Text>
            <Text style={{color: t.palette.primary_500}}>Left-Leaning</Text>
          </View>
          <View style={[styles.item, pal.border]}>
            <Text style={[pal.text, {fontWeight: '500'}]}>Diplomatic</Text>
            <Text style={{color: t.palette.primary_500}}>
              Non-Interventionist
            </Text>
          </View>
        </View>

        {/* UNOFFICIAL / PROPOSED AXES */}
        <View style={[styles.section]}>
          <Text style={[styles.sectionTitle, pal.text]}>
            <Trans>Unofficial Appends (Proposals)</Trans>
          </Text>
          <Text style={[pal.textLight, {marginBottom: 12}]}>
            <Trans>
              Proposed appends for this community. Vote to make them official.
            </Trans>
          </Text>
          {appends.map(item => (
            <View key={item.id} style={[styles.item, pal.border]}>
              <View style={{flex: 1}}>
                <Text style={[pal.text, {fontWeight: '500'}]}>
                  {item.title}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 8,
                  }}>
                  <RedditVoteButton
                    score={item.votes}
                    currentVote="none"
                    hasBeenToggled={false}
                    onUpvote={() => console.log('Upvoted proposal', item.id)}
                    onDownvote={() =>
                      console.log('Downvoted proposal', item.id)
                    }
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* STATS */}
        <View style={[styles.section]}>
          <Text style={[styles.sectionTitle, pal.text]}>
            <Trans>Axis Insights</Trans>
          </Text>
          <Text style={[pal.textLight, {marginBottom: 16}]}>
            <Trans>Key metrics understanding the community's stance.</Trans>
          </Text>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
            <View style={{alignItems: 'center', flex: 1}}>
              <Text style={[pal.text, {fontSize: 20, fontWeight: 'bold'}]}>
                Left
              </Text>
              <Text
                style={[pal.textLight, {fontSize: 12, textAlign: 'center'}]}>
                <Trans>Alignment</Trans>
              </Text>
              <Text
                style={[
                  pal.textLight,
                  {
                    fontSize: 10,
                    textAlign: 'center',
                    marginTop: 4,
                    opacity: 0.7,
                  },
                ]}>
                <Trans>Dominant Direction</Trans>
              </Text>
            </View>

            <View style={{width: 1, backgroundColor: pal.border.borderColor}} />

            <View style={{alignItems: 'center', flex: 1}}>
              <Text style={[pal.text, {fontSize: 20, fontWeight: 'bold'}]}>
                High
              </Text>
              <Text
                style={[pal.textLight, {fontSize: 12, textAlign: 'center'}]}>
                <Trans>Polarization</Trans>
              </Text>
              <Text
                style={[
                  pal.textLight,
                  {
                    fontSize: 10,
                    textAlign: 'center',
                    marginTop: 4,
                    opacity: 0.7,
                  },
                ]}>
                <Trans>Division Level</Trans>
              </Text>
            </View>

            <View style={{width: 1, backgroundColor: pal.border.borderColor}} />

            <View style={{alignItems: 'center', flex: 1}}>
              <Text style={[pal.text, {fontSize: 20, fontWeight: 'bold'}]}>
                1.2k
              </Text>
              <Text
                style={[pal.textLight, {fontSize: 12, textAlign: 'center'}]}>
                <Trans>Activity</Trans>
              </Text>
              <Text
                style={[
                  pal.textLight,
                  {
                    fontSize: 10,
                    textAlign: 'center',
                    marginTop: 4,
                    opacity: 0.7,
                  },
                ]}>
                <Trans>Total Votes</Trans>
              </Text>
            </View>
          </View>
        </View>

        {/* OPEN QUESTIONS */}
        <View style={[styles.section]}>
          <Text style={[styles.sectionTitle, pal.text]}>
            <Trans>Open Questions</Trans>
          </Text>
          <Text style={[pal.textLight, {marginBottom: 12}]}>
            <Trans>Questions related to this axis.</Trans>
          </Text>
          {[
            'How should we balance innovation with regulation?',
            'What role should AI play in governance?',
            'Should we subsidize green tech startups?',
          ].map((q, i) => (
            <View key={i} style={[styles.item, pal.border]}>
              <View style={{flex: 1}}>
                <Text style={[pal.text, {fontWeight: '500'}]}>{q}</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 8,
                  }}>
                  <Button
                    label={_(msg`Reply`)}
                    size="tiny"
                    variant="ghost"
                    color="secondary"
                    onPress={() => console.log('Reply to', q)}>
                    <ButtonText>
                      <Trans>Reply</Trans>
                    </ButtonText>
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </View>
      </Layout.Content>

      <AddRAQDialog control={addDialogControl} />
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
})
