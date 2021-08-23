import { observable } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'
import {
  NativeSyntheticEvent,
  TextInput,
  TextInputSelectionChangeEventData,
} from 'react-native'

import sip from '../api/sip'
import KeyPad from '../components/CallKeyPad'
import ShowNumber from '../components/CallShowNumbers'
import Layout from '../components/Layout'
import { getAuthStore } from '../stores/authStore'
import callStore from '../stores/callStore'
import intl from '../stores/intl'
import Nav from '../stores/Nav'
import RnKeyboard from '../stores/RnKeyboard'

@observer
class PageCallDtmfKeypad extends React.Component<{
  callId: string
  partyName: string
}> {
  @observable txt = ''
  txtRef = React.createRef<TextInput>()
  txtSelection = { start: 0, end: 0 }

  showKeyboard = () => {
    this.txtRef.current?.focus()
  }

  sendKey = (key: string) => {
    const c = callStore.calls.find(c => c.id === this.props.callId)
    sip.sendDTMF({
      signal: key,
      sessionId: this.props.callId,
      tenant: c?.pbxTenant || getAuthStore().currentProfile.pbxTenant,
      talkerId: c?.pbxTalkerId || c?.partyNumber || c?.partyName || '',
    })
  }

  render() {
    return (
      <Layout
        title={this.props.partyName}
        description={intl`Keypad dial manually`}
        onBack={Nav().backToPageCallManage}
      >
        <ShowNumber
          refInput={this.txtRef}
          selectionChange={
            RnKeyboard.isKeyboardShowing
              ? undefined
              : (
                  e: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
                ) => {
                  Object.assign(this.txtSelection, {
                    start: e.nativeEvent.selection.start,
                    end: e.nativeEvent.selection.end,
                  })
                }
          }
          setTarget={(v: string) => {
            this.txt = v
          }}
          value={this.txt}
        />
        {!RnKeyboard.isKeyboardShowing && (
          <KeyPad
            onPressNumber={v => {
              this.sendKey(v)
              const { end, start } = this.txtSelection
              let min = Math.min(start, end)
              const max = Math.max(start, end)
              const isDelete = v === ''
              if (isDelete) {
                if (start === end && start) {
                  min = min - 1
                }
              }
              // Update text to trigger render
              const t = this.txt
              this.txt = t.substring(0, min) + v + t.substring(max)
              //
              const p = min + (isDelete ? 0 : 1)
              this.txtSelection.start = p
              this.txtSelection.end = p
            }}
            showKeyboard={this.showKeyboard}
          />
        )}
      </Layout>
    )
  }
}

export default PageCallDtmfKeypad
