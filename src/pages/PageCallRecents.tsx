import { mdiMagnify, mdiPhone, mdiVideo } from '@mdi/js'
import { observer } from 'mobx-react'
import moment from 'moment'
import React, { Component } from 'react'
import { Platform } from 'react-native'

// import Torch from 'react-native-torch'
import { UserItem } from '../components/ContactUserItem'
import { Field } from '../components/Field'
import { Layout } from '../components/Layout'
import { getAuthStore } from '../stores/authStore'
import { AuthStore } from '../stores/authStore2'
import { callStore } from '../stores/callStore'
import { contactStore } from '../stores/contactStore'
import { intl } from '../stores/intl'
import { openFlashLight } from '../utils/flashLight'
import { PushNotification } from '../utils/PushNotification.ios'

@observer
export class PageCallRecents extends Component {
  isMatchUser = (call: AuthStore['currentData']['recentCalls'][0]) => {
    if (call.partyNumber.includes(contactStore.callSearchRecents)) {
      return call.id
    }
    return ''
  }
  componentDidUpdate = () => {
    Platform.OS === 'ios' && PushNotification.resetBadgeNumber()
    openFlashLight(false)
  }
  getAvatar = (id: string) => {
    const ucUser = contactStore.getUcUserById(id) || {}
    return {
      id,
      avatar: ucUser.avatar,
    }
  }
  getMatchedCalls = () => {
    const calls = getAuthStore().currentData.recentCalls.filter(
      this.isMatchUser,
    )
    // Backward compatibility to remove invalid items from the previous versions
    const filteredCalls = calls.filter(
      c =>
        typeof c.created === 'string' &&
        // HH:mm - MMM D
        ((c.created + '').length === 13 || (c.created + '').length === 14),
    )
    const today = moment().format('MMM D')
    return filteredCalls.map(c => ({
      ...c,
      created: (c.created + '').replace(` - ${today}`, ''),
    }))
  }

  render() {
    const calls = this.getMatchedCalls()
    return (
      <Layout
        description={intl`Recent voicemails and calls`}
        menu='call'
        subMenu='recents'
        title={intl`Recents`}
      >
        <Field
          icon={mdiMagnify}
          label={intl`SEARCH NAME, PHONE NUMBER ...`}
          onValueChange={(v: string) => {
            contactStore.callSearchRecents = v
          }}
          value={contactStore.callSearchRecents}
        />
        <Field
          isGroup
          label={intl`VOICEMAILS (${callStore.newVoicemailCount})`}
        />
        <UserItem
          iconFuncs={[() => callStore.startCall('8')]}
          icons={[mdiPhone]}
          name={'Voicemails'}
          isVoicemail
        />
        <Field isGroup label={intl`RECENT CALLS (${calls.length})`} />
        {calls.map((c, i) => (
          <UserItem
            iconFuncs={[
              () => callStore.startVideoCall(c.partyNumber),
              () => callStore.startCall(c.partyNumber),
            ]}
            {...contactStore.getUcUserById(c.partyNumber)}
            icons={[mdiVideo, mdiPhone]}
            isRecentCall
            canChat={getAuthStore().currentProfile.ucEnabled}
            key={i}
            {...this.getAvatar(c.partyNumber)}
            {...c}
          />
        ))}
      </Layout>
    )
  }
}
