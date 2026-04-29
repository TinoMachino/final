import {useCallback, useState} from 'react'
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Lock_Stroke2_Corner0_Rounded as LockIcon} from '#/components/icons/Lock'
import {Person_Stroke2_Corner0_Rounded as UsersIcon} from '#/components/icons/Person'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {useAcuerdos} from '#/state/shell/acuerdos'

export function AcuerdoListScreen() {
  const {_} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const {acuerdos, myLocks, isLoading, joinAcuerdo, requestExit} = useAcuerdos()
  const [showCreate, setShowCreate] = useState(false)

  const publicAcuerdos = acuerdos.filter(a => a.visibility === 'public')
  const myLockedUris = new Set(myLocks.map(l => l.acuerdo))

  return (
    <Layout.Screen testID="acuerdoListScreen">
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Acuerdos</Trans>
          </Layout.Header.TitleText>
          <Layout.Header.SubtitleText>
            Coaliciones de voto bloqueado
          </Layout.Header.SubtitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Create button */}
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.createBtn, {backgroundColor: t.palette.primary_500}]}
          onPress={() => setShowCreate(true)}>
          <Text style={styles.createBtnText}>+ Crear Acuerdo</Text>
        </TouchableOpacity>

        {/* My Locks */}
        {myLocks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, t.atoms.text]}>
              <Trans>Mis Votos Bloqueados</Trans>
            </Text>
            {myLocks.map(lock => {
              const acuerdo = acuerdos.find(a => a.uri === lock.acuerdo)
              const isExiting = !!lock.exitRequestedAt && !lock.exitCooldownEndsAt
              const isCooldown = !!lock.exitCooldownEndsAt && new Date(lock.exitCooldownEndsAt) > new Date()

              return (
                <View key={lock.id} style={[styles.lockCard, t.atoms.bg_contrast_25]}>
                  <View style={styles.lockHeader}>
                    <LockIcon size="sm" style={{color: t.palette.primary_500}} />
                    <Text style={[styles.lockTitle, t.atoms.text]}>
                      {acuerdo?.title || 'Acuerdo desconocido'}
                    </Text>
                  </View>
                  <Text style={[styles.lockMeta, t.atoms.text_contrast_medium]}>
                    Bloqueado: {new Date(lock.lockedAt).toLocaleDateString()}
                  </Text>
                  {lock.commitment.type === 'delegate-to-rep' && (
                    <Text style={[styles.lockBadge, {color: t.palette.positive_500}]}>
                      Delegado a representante
                    </Text>
                  )}
                  {isCooldown && (
                    <Text style={[styles.cooldownText, {color: t.palette.negative_500}]}>
                      Cooldown de salida activo
                    </Text>
                  )}
                  <Button
                    variant="ghost"
                    color="negative"
                    size="small"
                    label="exit"
                    onPress={() => requestExit(lock.id)}
                    disabled={isCooldown || isExiting}>
                    <ButtonText>
                      {isCooldown ? 'Esperando cooldown...' : 'Solicitar salida'}
                    </ButtonText>
                  </Button>
                </View>
              )
            })}
          </View>
        )}

        {/* Public Acuerdos */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, t.atoms.text]}>
            <Trans>Acuerdos Públicos</Trans>
          </Text>
          {publicAcuerdos.map(acuerdo => {
            const isLocked = myLockedUris.has(acuerdo.uri)
            return (
              <TouchableOpacity
                accessibilityRole="button"
                key={acuerdo.uri}
                style={[styles.acuerdoCard, t.atoms.bg_contrast_25]}
                onPress={() => {
                  // TODO: navigate to AcuerdoDetail when screen exists
                  console.log('Navigate to acuerdo:', acuerdo.uri)
                }}>
                <View style={styles.acuerdoHeader}>
                  <Text style={[styles.acuerdoTitle, t.atoms.text]}>
                    {acuerdo.title}
                  </Text>
                  <View style={[styles.phaseBadge, {backgroundColor: getPhaseColor(acuerdo.phase, t)}]}>
                    <Text style={styles.phaseText}>{acuerdo.phase}</Text>
                  </View>
                </View>
                <Text style={[styles.acuerdoDesc, t.atoms.text_contrast_medium]} numberOfLines={2}>
                  {acuerdo.description}
                </Text>
                <View style={styles.acuerdoStats}>
                  <View style={styles.stat}>
                    <UsersIcon size="xs" style={t.atoms.text_contrast_medium} />
                    <Text style={[styles.statText, t.atoms.text_contrast_medium]}>
                      {acuerdo.lockedCount} bloqueados
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <LockIcon size="xs" style={t.atoms.text_contrast_medium} />
                    <Text style={[styles.statText, t.atoms.text_contrast_medium]}>
                      Min: {acuerdo.minLockQuorum}
                    </Text>
                  </View>
                </View>
                {!isLocked && acuerdo.phase === 'active' && (
                  <View style={styles.actions}>
                    <Button
                      variant="solid"
                      color="primary"
                      size="small"
                      label="lock"
                      onPress={() => joinAcuerdo(acuerdo.uri, 'follow-acuerdo')}>
                      <ButtonText>Bloquear voto</ButtonText>
                    </Button>
                    <Button
                      variant="outline"
                      color="primary"
                      size="small"
                      label="delegate"
                      onPress={() => joinAcuerdo(acuerdo.uri, 'delegate-to-rep')}>
                      <ButtonText>Delegar</ButtonText>
                    </Button>
                  </View>
                )}
                {isLocked && (
                  <View style={[styles.lockedBadge, {backgroundColor: t.palette.primary_500 + '20'}]}>
                    <LockIcon size="xs" style={{color: t.palette.primary_500}} />
                    <Text style={[styles.lockedText, {color: t.palette.primary_500}]}>
                      Tu voto está bloqueado
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      {/* Create Modal */}
      <CreateAcuerdoModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </Layout.Screen>
  )
}

function CreateAcuerdoModal({visible, onClose}: {visible: boolean; onClose: () => void}) {
  const t = useTheme()
  const {createAcuerdo} = useAcuerdos()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [minQuorum, setMinQuorum] = useState('10')

  const handleCreate = useCallback(() => {
    createAcuerdo({
      title,
      description,
      author: 'did:plc:viewer',
      scope: {type: 'policy', subjects: []},
      visibility: isPublic ? 'public' : 'private',
      admins: ['did:plc:viewer'],
      minLockQuorum: parseInt(minQuorum, 10) || 10,
      phase: 'forming',
    })
    onClose()
  }, [title, description, isPublic, minQuorum, createAcuerdo, onClose])

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.modalOverlay, {backgroundColor: 'rgba(0,0,0,0.5)'}]}>
        <View style={[styles.modalContent, t.atoms.bg]}>
          <Text style={[styles.modalTitle, t.atoms.text]}>Crear Acuerdo</Text>
          <TextInput
            style={[styles.input, t.atoms.bg_contrast_25, t.atoms.text]}
            placeholder="Título del acuerdo"
            placeholderTextColor={t.palette.contrast_400}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea, t.atoms.bg_contrast_25, t.atoms.text]}
            placeholder="Descripción"
            placeholderTextColor={t.palette.contrast_400}
            multiline
            value={description}
            onChangeText={setDescription}
          />
          <View style={styles.row}>
            <Text style={t.atoms.text}>Público</Text>
            <Switch value={isPublic} onValueChange={setIsPublic} />
          </View>
          <TextInput
            style={[styles.input, t.atoms.bg_contrast_25, t.atoms.text]}
            placeholder="Quorum mínimo"
            placeholderTextColor={t.palette.contrast_400}
            keyboardType="numeric"
            value={minQuorum}
            onChangeText={setMinQuorum}
          />
          <View style={styles.modalActions}>
            <Button variant="ghost" label="cancel" onPress={onClose}>
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button variant="solid" color="primary" label="create" onPress={handleCreate}>
              <ButtonText>Crear</ButtonText>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function getPhaseColor(phase: string, t: ReturnType<typeof useTheme>) {
  switch (phase) {
    case 'forming': return t.palette.contrast_400 + '30'
    case 'active': return t.palette.primary_500 + '30'
    case 'locked': return t.palette.positive_500 + '30'
    case 'resolved': return t.palette.primary_500 + '30'
    case 'cancelled': return t.palette.negative_500 + '30'
    default: return t.palette.contrast_400 + '30'
  }
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {padding: 16, paddingBottom: 100},
  createBtn: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  createBtnText: {color: 'white', fontWeight: '700', fontSize: 16},
  section: {marginBottom: 24},
  sectionTitle: {fontSize: 20, fontWeight: '800', marginBottom: 16},
  lockCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 8,
  },
  lockHeader: {flexDirection: 'row', alignItems: 'center', gap: 8},
  lockTitle: {fontSize: 16, fontWeight: '700'},
  lockMeta: {fontSize: 13},
  lockBadge: {fontSize: 12, fontWeight: '600'},
  cooldownText: {fontSize: 12, fontWeight: '600'},
  acuerdoCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 8,
  },
  acuerdoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  acuerdoTitle: {fontSize: 16, fontWeight: '700', flex: 1},
  phaseBadge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12},
  phaseText: {fontSize: 11, fontWeight: '700', textTransform: 'uppercase'},
  acuerdoDesc: {fontSize: 14, lineHeight: 20},
  acuerdoStats: {flexDirection: 'row', gap: 16, marginTop: 4},
  stat: {flexDirection: 'row', alignItems: 'center', gap: 4},
  statText: {fontSize: 12},
  actions: {flexDirection: 'row', gap: 8, marginTop: 8},
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  lockedText: {fontSize: 12, fontWeight: '600'},
  modalOverlay: {flex: 1, justifyContent: 'flex-end'},
  modalContent: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 16,
  },
  modalTitle: {fontSize: 20, fontWeight: '800'},
  input: {
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
  },
  textArea: {height: 100, textAlignVertical: 'top'},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  modalActions: {flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8},
})
