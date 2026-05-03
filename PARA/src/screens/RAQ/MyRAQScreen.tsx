import {ScrollView, StyleSheet, View} from 'react-native'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

export function MyRAQScreen() {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()

  return (
    <Layout.Screen testID="myRaqScreen">
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>My RAQ</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}>
        <Layout.Center style={styles.center}>
          {/* Main Assessment CTA */}
          <View style={[styles.mainCard, t.atoms.bg_contrast_25]}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>📊</Text>
            </View>
            <Text style={[styles.cardTitle, t.atoms.text]}>
              Assessment Status
            </Text>
            <Text style={[styles.cardDesc, t.atoms.text_contrast_medium]}>
              You have completed 42 of 96 questions in the Official RAQ.
            </Text>

            {/* Progress Bar */}
            <View style={[styles.progressBarBg, t.atoms.bg_contrast_50]}>
              <View
                style={[
                  styles.progressBarFill,
                  {backgroundColor: t.palette.primary_500, width: '44%'},
                ]}
              />
            </View>
            <Text style={[styles.progressText, t.atoms.text_contrast_medium]}>
              44% Complete
            </Text>

            <Button
              label="Continue Assessment"
              onPress={() => navigation.navigate('RAQAssessment')}
              size="large"
              variant="solid"
              color="primary"
              style={styles.ctaButton}>
              <ButtonText>Resume RAQ Assessment</ButtonText>
            </Button>
          </View>

          {/* Results Summary */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, t.atoms.text]}>
              Latest Results
            </Text>
            <View style={[styles.resultCard, t.atoms.bg_contrast_25]}>
              <View style={styles.resultHeader}>
                <Text
                  style={[styles.resultType, {color: t.palette.primary_500}]}>
                  OFFICIAL AXES
                </Text>
                <Text style={[styles.resultDate, t.atoms.text_contrast_medium]}>
                  Apr 28, 2026
                </Text>
              </View>
              <Text style={[styles.resultTitle, t.atoms.text]}>
                Centrist / Pragmatic
              </Text>
              <Text style={[styles.resultDesc, t.atoms.text_contrast_medium]}>
                Based on your current progress, you lean towards decentralized
                policy solutions.
              </Text>
              <Button
                label="View full breakdown"
                onPress={() => navigation.navigate('RAQResults', {results: []})}
                size="large"
                variant="outline"
                color="primary"
                style={styles.resultButton}>
                <ButtonText>View full breakdown</ButtonText>
              </Button>
            </View>
          </View>

          {/* Participation Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, t.atoms.text]}>
              Community Questions
            </Text>
            <View style={styles.participationRow}>
              <View style={[styles.participationItem, t.atoms.bg_contrast_25]}>
                <Text style={[styles.pCount, t.atoms.text]}>12</Text>
                <Text style={[styles.pLabel, t.atoms.text_contrast_medium]}>
                  Answered
                </Text>
              </View>
              <View style={[styles.participationItem, t.atoms.bg_contrast_25]}>
                <Text style={[styles.pCount, t.atoms.text]}>5</Text>
                <Text style={[styles.pLabel, t.atoms.text_contrast_medium]}>
                  Proposed
                </Text>
              </View>
            </View>

            <Button
              label="Manage proposed questions"
              onPress={() => navigation.navigate('ProposedRAQList')}
              size="large"
              variant="solid"
              color="secondary"
              style={styles.manageButton}>
              <ButtonText>Manage proposed questions</ButtonText>
            </Button>
          </View>
        </Layout.Center>
      </ScrollView>
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {paddingBottom: 80},
  center: {paddingHorizontal: 16, paddingTop: 16},
  mainCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconEmoji: {fontSize: 32},
  cardTitle: {fontSize: 22, fontWeight: '800', marginBottom: 8},
  cardDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {fontSize: 12, fontWeight: '700', marginBottom: 24},
  ctaButton: {width: '100%', borderRadius: 14},
  section: {marginBottom: 32},
  sectionTitle: {fontSize: 18, fontWeight: '800', marginBottom: 12},
  resultCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultType: {fontSize: 11, fontWeight: '900', letterSpacing: 0.5},
  resultDate: {fontSize: 11, fontWeight: '600'},
  resultTitle: {fontSize: 17, fontWeight: '800', marginBottom: 4},
  resultDesc: {fontSize: 13, lineHeight: 18, marginBottom: 16},
  resultButton: {width: '100%', borderRadius: 14},
  participationRow: {flexDirection: 'row', gap: 12, marginBottom: 12},
  participationItem: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  pCount: {fontSize: 20, fontWeight: '900'},
  pLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  manageButton: {width: '100%', borderRadius: 14},
})
