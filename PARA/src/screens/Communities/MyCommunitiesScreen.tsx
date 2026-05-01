import {useMemo, useState} from 'react'
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {
  POLITICAL_AFFILIATION_OPTIONS,
  type PoliticalAffiliation,
} from '#/lib/political-affiliations'
import {type NavigationProp} from '#/lib/routes/types'
import {useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

// ─────────────────────────────────────────────────────────────────────────────
// Types & Helpers
// ─────────────────────────────────────────────────────────────────────────────

interface CommunityEngagement {
  id: string
  uri: string
  activeDeliberations: number
  unseenActivity: number
  role: 'Delegate' | 'Voter' | 'Observer'
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export function MyCommunitiesScreen() {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const [activeTab, setActiveTab] = useState<'All' | 'Parties' | 'Geographic'>(
    'All',
  )

  // Mock engagement data mapped to official IDs
  const engagement: Record<string, CommunityEngagement> = useMemo(
    () => ({
      'party-morena': {
        id: 'party-morena',
        uri: 'p/morena',
        activeDeliberations: 3,
        unseenActivity: 5,
        role: 'Delegate',
      },
      'ninth-auth-left': {
        id: 'ninth-auth-left',
        uri: 'g/auth-left',
        activeDeliberations: 1,
        unseenActivity: 0,
        role: 'Voter',
      },
      'ninth-center': {
        id: 'ninth-center',
        uri: 'g/center',
        activeDeliberations: 0,
        unseenActivity: 2,
        role: 'Observer',
      },
      'twenty-fifth-2-2': {
        id: 'twenty-fifth-2-2',
        uri: 'g/25th-2-2',
        activeDeliberations: 4,
        unseenActivity: 12,
        role: 'Voter',
      },
    }),
    [],
  )

  const joinedParties = useMemo(
    () => POLITICAL_AFFILIATION_OPTIONS.party.filter(p => engagement[p.id]),
    [engagement],
  )

  const joinedNinths = useMemo(
    () => POLITICAL_AFFILIATION_OPTIONS.ninth.filter(n => engagement[n.id]),
    [engagement],
  )

  const joinedTwentyFifths = useMemo(
    () =>
      POLITICAL_AFFILIATION_OPTIONS.twentyFifth.filter(tf => engagement[tf.id]),
    [engagement],
  )

  return (
    <Layout.Screen testID="myCommunitiesScreen">
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>My Communities</Trans>
          </Layout.Header.TitleText>
          <Layout.Header.SubtitleText>
            <Trans>Organized by Parties and Geographic Regions</Trans>
          </Layout.Header.SubtitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        stickyHeaderIndices={[0]}>
        {/* Tab Bar */}
        <View style={[styles.tabBar, t.atoms.bg]}>
          <Layout.Center>
            <View style={styles.tabRow}>
              {(['All', 'Parties', 'Geographic'] as const).map(tab => (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.tabItem,
                    activeTab === tab && {
                      borderBottomColor: t.palette.primary_500,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab
                        ? {color: t.palette.primary_500, fontWeight: '800'}
                        : t.atoms.text_contrast_medium,
                    ]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Layout.Center>
        </View>

        <Layout.Center style={styles.mainCenter}>
          {/* ─── PARTIES (p/) ─── */}
          {(activeTab === 'All' || activeTab === 'Parties') &&
            joinedParties.length > 0 && (
              <Section title="Parties" prefix="p/">
                {joinedParties.map(p => (
                  <CommunityCard
                    key={p.id}
                    affiliation={p}
                    engagement={engagement[p.id]}
                    onPress={() =>
                      navigation.navigate('CommunityProfile', {
                        communityId: p.id,
                        communityName: p.name,
                      })
                    }
                  />
                ))}
              </Section>
            )}

          {/* ─── GEOGRAPHIC (g/) ─── */}
          {(activeTab === 'All' || activeTab === 'Geographic') &&
            (joinedNinths.length > 0 || joinedTwentyFifths.length > 0) && (
              <Section title="Geographic Regions" prefix="g/">
                {joinedNinths.map(n => (
                  <CommunityCard
                    key={n.id}
                    affiliation={n}
                    engagement={engagement[n.id]}
                    onPress={() =>
                      navigation.navigate('CommunityProfile', {
                        communityId: n.id,
                        communityName: n.name,
                      })
                    }
                  />
                ))}
                {joinedTwentyFifths.map(tf => (
                  <CommunityCard
                    key={tf.id}
                    affiliation={tf}
                    engagement={engagement[tf.id]}
                    onPress={() =>
                      navigation.navigate('CommunityProfile', {
                        communityId: tf.id,
                        communityName: tf.name,
                      })
                    }
                  />
                ))}
              </Section>
            )}

          {/* Bottom Actions */}
          <View style={styles.footer}>
            <Button
              label="Explore Compass"
              onPress={() => navigation.navigate('Compass')}
              size="large"
              variant="solid"
              color="primary"
              style={styles.footerButton}>
              <ButtonText>Explore the Compass</ButtonText>
            </Button>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => navigation.navigate('Communities')}
              style={styles.directoryLink}>
              <Text
                style={[styles.directoryText, {color: t.palette.primary_500}]}>
                View global directory →
              </Text>
            </TouchableOpacity>
          </View>
        </Layout.Center>
      </ScrollView>
    </Layout.Screen>
  )
}

function Section({
  title,
  prefix,
  children,
}: {
  title: string
  prefix: string
  children: React.ReactNode
}) {
  const t = useTheme()
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, t.atoms.text]}>{title}</Text>
        <View style={[styles.prefixBadge, t.atoms.bg_contrast_25]}>
          <Text style={[styles.prefixText, t.atoms.text_contrast_medium]}>
            {prefix}
          </Text>
        </View>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  )
}

function CommunityCard({
  affiliation,
  engagement,
  onPress,
}: {
  affiliation: PoliticalAffiliation
  engagement: CommunityEngagement
  onPress: () => void
}) {
  const t = useTheme()

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.card, t.atoms.bg_contrast_25]}>
      <View style={styles.cardMain}>
        <View style={[styles.colorBar, {backgroundColor: affiliation.color}]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardName, t.atoms.text]}>
              {affiliation.name}
            </Text>
            <View
              style={[
                styles.rolePill,
                {backgroundColor: t.palette.primary_500 + '15'},
              ]}>
              <Text style={[styles.roleText, {color: t.palette.primary_500}]}>
                {engagement.role}
              </Text>
            </View>
          </View>
          <Text style={[styles.cardUri, t.atoms.text_contrast_medium]}>
            {engagement.uri}
          </Text>

          <View style={styles.cardStats}>
            <Text style={[styles.statItem, t.atoms.text_contrast_medium]}>
              🗳️{' '}
              <Text style={[t.atoms.text, {fontWeight: '700'}]}>
                {engagement.activeDeliberations}
              </Text>{' '}
              active
            </Text>
            <View style={styles.dotDivider} />
            <Text style={[styles.statItem, t.atoms.text_contrast_medium]}>
              📢{' '}
              <Text style={[t.atoms.text, {fontWeight: '700'}]}>
                {engagement.unseenActivity}
              </Text>{' '}
              updates
            </Text>
          </View>
        </View>
        <Text style={[styles.chevron, t.atoms.text_contrast_medium]}>›</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {paddingBottom: 60},
  mainCenter: {paddingHorizontal: 16, paddingTop: 16},

  // Tabs
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Sections
  section: {marginBottom: 32},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  prefixBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  prefixText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  sectionContent: {gap: 12},

  // Cards
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorBar: {
    width: 6,
    height: '100%',
  },
  cardBody: {
    flex: 1,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '800',
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cardUri: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    fontSize: 12,
  },
  dotDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  chevron: {
    fontSize: 24,
    marginRight: 16,
    marginLeft: 8,
  },

  // Footer
  footer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 16,
  },
  footerButton: {width: '100%', borderRadius: 16},
  directoryLink: {paddingVertical: 8},
  directoryText: {fontSize: 14, fontWeight: '700'},
})
