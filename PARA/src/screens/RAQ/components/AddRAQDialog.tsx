import {useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {Text} from '#/view/com/util/text/Text'
import {useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'

export function AddRAQDialog({
  control,
}: {
  control: Dialog.DialogOuterProps['control']
}) {
  const t = useTheme()
  const {_} = useLingui()
  const [question, setQuestion] = useState('')
  const [community, setCommunity] = useState('')

  const onSubmit = () => {
    // Logic to submit question would go here
    console.log('Submitting question:', question, community)
    control.close()
  }

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={_(msg`Add Proposed Question`)}>
        <View style={styles.container}>
          <Text style={[styles.title, t.atoms.text]}>
            <Trans>Propose a Question</Trans>
          </Text>

          <View style={styles.inputGroup}>
            <TextField.Root>
              <TextField.LabelText>
                <Trans>Question Text</Trans>
              </TextField.LabelText>
              <TextField.Input
                value={question}
                onChangeText={setQuestion}
                placeholder={_(msg`e.g., Should we implement UBI?`)}
                label="Question Text"
              />
            </TextField.Root>
          </View>

          <View style={styles.inputGroup}>
            <TextField.Root>
              <TextField.LabelText>
                <Trans>Target Community (Optional)</Trans>
              </TextField.LabelText>
              <TextField.Input
                value={community}
                onChangeText={setCommunity}
                placeholder={_(msg`e.g., Economics`)}
                label="Target Community"
              />
            </TextField.Root>
          </View>

          <Button
            label={_(msg`Submit Proposal`)}
            onPress={onSubmit}
            size="large"
            variant="solid"
            color="primary"
            style={styles.btn}>
            <ButtonText>
              <Trans>Submit Proposal</Trans>
            </ButtonText>
          </Button>
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  btn: {
    marginTop: 10,
  },
})
