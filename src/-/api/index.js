import moment from 'moment'
import { Platform } from 'react-native'
import { v4 as uuid } from 'react-native-uuid'

import pbx from '../api/pbx'
import sip from '../api/sip'
import uc from '../api/uc'
import g from '../global'
import authStore from '../global/authStore'
import callStore from '../global/callStore'
import chatStore from '../global/chatStore'
import contactStore from '../global/contactStore'
import { intlDebug } from '../intl/intl'
import PushNotification from '../native/PushNotification'
import updatePhoneIndex from './updatePhoneIndex'

class Api {
  constructor() {
    pbx.on('connection-started', this.onPBXConnectionStarted)
    pbx.on('connection-stopped', this.onPBXConnectionStopped)
    pbx.on('connection-timeout', this.onPBXConnectionTimeout)
    pbx.on('user-calling', this.onPBXUserCalling)
    pbx.on('user-ringing', this.onPBXUserRinging)
    pbx.on('user-talking', this.onPBXUserTalking)
    pbx.on('user-holding', this.onPBXUserHolding)
    pbx.on('user-hanging', this.onPBXUserHanging)
    pbx.on('voicemail-updated', this.onVoiceMailUpdated)
    sip.on('connection-started', this.onSIPConnectionStarted)
    sip.on('connection-stopped', this.onSIPConnectionStopped)
    sip.on('connection-timeout', this.onSIPConnectionTimeout)
    sip.on('session-started', this.onSIPSessionStarted)
    sip.on('session-updated', this.onSIPSessionUpdated)
    sip.on('session-stopped', this.onSIPSessionStopped)
    uc.on('connection-stopped', this.onUCConnectionStopped)
    uc.on('user-updated', this.onUCUserUpdated)
    uc.on('buddy-chat-created', this.onBuddyChatCreated)
    uc.on('group-chat-created', this.onGroupChatCreated)
    uc.on('chat-group-invited', this.onChatGroupInvited)
    uc.on('chat-group-revoked', this.onChatGroupRevoked)
    uc.on('chat-group-updated', this.onChatGroupUpdated)
    uc.on('file-received', this.onFileReceived)
    uc.on('file-progress', this.onFileProgress)
    uc.on('file-finished', this.onFileFinished)
  }
  pbxAndSipStarted = 0

  onPBXAndSipStarted = async () => {
    try {
      await this._onPBXAndSipStarted()
    } catch (err) {
      console.error('api.onPBXAndSipStarted:', err)
    }
  }

  _onPBXAndSipStarted = async () => {
    if (this.pbxAndSipStarted < 1) {
      this.pbxAndSipStarted += 1
      return
    }

    this.pbxAndSipStarted = 0
    const webPhone = await updatePhoneIndex()

    if (!webPhone) {
      return
    }

    this.addPnToken(webPhone)
  }

  addPnToken = async phone => {
    let t = await PushNotification.getToken()
    let tvoip = t
    if (Platform.OS === 'ios') {
      tvoip = await PushNotification.getVoipToken()
      if (!t) {
        t = tvoip
      }
    }

    if (!t) {
      return
    }

    if (Platform.OS === 'ios') {
      await pbx.addApnsToken({
        username: phone.id,
        device_id: t,
      })
      await pbx.addApnsToken({
        username: phone.id,
        device_id: tvoip || t,
        voip: true,
      })
    } else if (Platform.OS === 'android') {
      await pbx.addFcmPnToken({
        username: phone.id,
        device_id: t,
      })
      await pbx.addFcmPnToken({
        username: phone.id,
        device_id: t,
        voip: true,
      })
    } else if (Platform.OS === 'web') {
      await pbx.addWebPnToken({
        user: phone.id,
        endpoint: t.endpoint,
        auth_secret: t.auth,
        key: t.p256dh,
      })
    }
  }

  onPBXConnectionStarted = () => {
    this.loadPBXUsers().catch(err => {
      g.showError({
        message: intlDebug`Failed to load PBX users`,
        err,
      })
    })

    setTimeout(this.onPBXAndSipStarted)
  }

  onPBXConnectionStopped = () => {
    authStore.pbxState = 'stopped'
  }

  onPBXConnectionTimeout = () => {
    authStore.pbxState = 'failure'
    authStore.pbxTotalFailure += 1
  }

  loadPBXUsers = async () => {
    if (!authStore.currentProfile) {
      return
    }
    const tenant = authStore.currentProfile.pbxTenant
    const username = authStore.currentProfile.pbxUsername
    const userIds = await pbx
      .getUsers(tenant)
      .then(ids => ids.filter(id => id !== username))
    const users = await pbx.getOtherUsers(tenant, userIds)
    contactStore.pbxUsers = users
  }

  onPBXUserCalling = ev => {
    contactStore.setTalkerStatus(ev.user, ev.talker, 'calling')
  }
  onPBXUserRinging = ev => {
    contactStore.setTalkerStatus(ev.user, ev.talker, 'ringing')
  }
  onPBXUserTalking = ev => {
    contactStore.setTalkerStatus(ev.user, ev.talker, 'talking')
  }
  onPBXUserHolding = ev => {
    contactStore.setTalkerStatus(ev.user, ev.talker, 'holding')
  }
  onPBXUserHanging = ev => {
    contactStore.setTalkerStatus(ev.user, ev.talker, '')
  }

  onVoiceMailUpdated = ev => {
    callStore.newVoicemailCount = ev?.new || 0
  }

  onSIPConnectionStarted = () => {
    authStore.sipState = 'success'
    setTimeout(this.onPBXAndSipStarted)
  }

  onSIPConnectionStopped = e => {
    if (!e?.reason && !e?.response) {
      authStore.sipState = 'stopped'
    } else {
      authStore.sipState = 'failure'
      authStore.sipTotalFailure += 1
    }
    setTimeout(() => sip.disconnect(), 300)
  }

  onSIPConnectionTimeout = () => {
    authStore.sipState = 'failure'
    authStore.sipTotalFailure += 1
    sip.disconnect()
  }

  onSIPSessionStarted = call => {
    const number = call.partyNumber
    if (number === '8') {
      call.partyName = 'Voicemails'
    }
    if (!call.partyName) {
      call.partyName = contactStore.getPBXUser(number)?.name
    }
    callStore.upsertCall(call)
  }
  onSIPSessionUpdated = call => {
    callStore.upsertCall(call)
  }
  onSIPSessionStopped = id => {
    const call = callStore._calls.find(c => c.id === id)
    authStore.pushRecentCall({
      id: uuid(),
      incoming: call.incoming,
      answered: call.answered,
      partyName: call.partyName,
      partyNumber: call.partyNumber,
      duration: call.duration,
      created: moment().format('HH:mm - MMM D'),
    })
    callStore.removeCall(call.id)
  }

  onUCConnectionStopped = () => {
    authStore.ucState = 'stopped'
  }

  onUCConnectionTimeout = () => {
    authStore.ucState = 'failure'
    authStore.ucTotalFailure += 1
  }

  onUCUserUpdated = ev => {
    contactStore.updateUCUser(ev)
  }

  onBuddyChatCreated = chat => {
    chatStore.pushMessages(chat.creator, chat, true)
  }
  onGroupChatCreated = chat => {
    chatStore.pushMessages(chat.group, chat, true)
  }

  onChatGroupInvited = group => {
    chatStore.upsertGroup(group)
  }
  onChatGroupUpdated = group => {
    chatStore.upsertGroup(group)
  }
  onChatGroupRevoked = group => {
    chatStore.removeGroup(group.id)
  }

  onFileReceived = file => {
    chatStore.upsertFile(file)
  }
  onFileProgress = file => {
    chatStore.upsertFile(file)
  }
  onFileFinished = file => {
    chatStore.upsertFile(file)
  }
}

export default new Api()
