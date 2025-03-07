import { Platform } from 'react-native'

import { Profile, profileStore } from '../stores/profileStore'
// @ts-ignore
import { PushNotification } from '../utils/PushNotification'
import { PBX } from './pbx'
import { setSyncPnTokenModule } from './syncPnToken'
import { updatePhoneIndex } from './updatePhoneIndex'

const syncPnTokenWithoutCatch = async (
  p: Profile,
  { noUpsert }: Pick<SyncPnTokenOption, 'noUpsert'>,
) => {
  if (Platform.OS === 'web') {
    console.error('PN sync debug: invalid platform')
    return
  }

  if (profileStore.pnSyncLoadingMap[p.id]) {
    console.error('PN sync debug: sync is loading')
    return
  }
  profileStore.pnSyncLoadingMap[p.id] = true

  const pbx = new PBX()
  await pbx.connect(p)

  const webPhone = await updatePhoneIndex(p, pbx)
  if (!webPhone) {
    console.error('PN sync debug: can not find webphone')
    return
  }

  let t = await PushNotification.getToken()
  let tvoip = t
  if (Platform.OS === 'ios') {
    tvoip = await PushNotification.getVoipToken()
    if (!t) {
      t = tvoip
    }
  }

  const fn =
    Platform.OS === 'ios'
      ? p.pushNotificationEnabled
        ? pbx.setApnsToken
        : pbx.removeApnsToken
      : Platform.OS === 'android'
      ? p.pushNotificationEnabled
        ? pbx.setFcmPnToken
        : pbx.removeFcmPnToken
      : null
  if (!fn) {
    console.error('PN sync debug: invalid platform')
    return
  }

  console.error(
    `PN sync debug: trying to turn ${
      p.pushNotificationEnabled ? 'on' : 'off'
    } PN for account ${p.pbxUsername}`,
  )

  const arr: Promise<unknown>[] = []
  if (t) {
    arr.push(
      fn({
        username: webPhone.id,
        device_id: t,
      }),
    )
  }
  if (tvoip) {
    arr.push(
      fn({
        username: webPhone.id,
        device_id: tvoip,
        voip: true,
      }),
    )
  }
  await Promise.all(arr)

  console.error('PBX PN debug: disconnect by syncPnToken')
  pbx.disconnect()

  if (!noUpsert) {
    profileStore.upsertProfile({
      id: p.id,
      pushNotificationEnabledSynced: true,
    })
  }

  profileStore.pnSyncLoadingMap[p.id] = false
}

export interface SyncPnTokenOption {
  noUpsert?: boolean
  onError?: (err: Error) => void
}

const syncPnToken = (p: Profile, o: SyncPnTokenOption = {}) => {
  return syncPnTokenWithoutCatch(p, o).catch((err: Error) => {
    profileStore.pnSyncLoadingMap[p.id] = false
    if (o.onError) {
      o.onError(err)
      return
    }
    console.error(
      `Failed to sync Push Notification settings for ${p.pbxUsername}`,
      err,
    )
  })
}

const syncPnTokenForAllAccounts = () => {
  profileStore.profiles.forEach(p => {
    if (p.pushNotificationEnabledSynced) {
      return
    }
    syncPnToken(p)
  })
}

const m = {
  sync: syncPnToken,
  syncForAllAccounts: syncPnTokenForAllAccounts,
}
setSyncPnTokenModule(m)

export type TSyncPnToken = typeof m
