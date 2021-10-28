import { intlDebug } from '../stores/intl'
import { RnAlert } from '../stores/RnAlert'

declare global {
  interface MediaDeviceInfo {
    id: string
    facing: string
  }
}
export const getCameraSourceId = async (isFront: boolean) => {
  const mediaDevices = window.navigator.mediaDevices
  if (!mediaDevices) {
    RnAlert.error({
      unexpectedErr: new Error(
        'Can not access mediaDevices, check if your connection is https secured',
      ),
    })
    return undefined
  }
  return mediaDevices
    .enumerateDevices()
    .then(a => {
      const value = a.find(i =>
        /videoinput/i.test(i.kind) && isFront
          ? /front/i.test(i.facing)
          : /environment/i.test(i.facing),
      )
      return value
    })
    .then(i => {
      console.log({ enumerateDevices: i })
      return i?.deviceId || undefined
    })
    .catch((err: Error) => {
      RnAlert.error({
        message: intlDebug`Failed to get front camera information`,
        err,
      })
      return undefined
    })
}
export const getCameraSourceIdsWeb = async () => {
  const mediaDevices = window.navigator.mediaDevices
  if (!mediaDevices) {
    RnAlert.error({
      unexpectedErr: new Error(
        'Can not access mediaDevices, check if your connection is https secured',
      ),
    })
    return []
  }
  return mediaDevices
    .enumerateDevices()
    .then(a => {
      return a.filter(i => /videoinput/i.test(i.kind))
    })
    .catch((err: Error) => {
      RnAlert.error({
        message: intlDebug`Failed to get front camera information`,
        err,
      })
      return []
    })
}
