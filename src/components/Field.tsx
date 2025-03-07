import flow from 'lodash/flow'
import omit from 'lodash/omit'
import { observer } from 'mobx-react'
import { ReactElementLike } from 'prop-types'
import React, { FC, useRef } from 'react'
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  StyleSheet,
  TextInputProps,
  TouchableOpacityProps,
  View,
  ViewProps,
} from 'react-native'

import {
  mdiCardsDiamond,
  mdiClose,
  mdiPlus,
  mdiUnfoldMoreHorizontal,
} from '../assets/icons'
import { intl } from '../stores/intl'
import { RnPicker } from '../stores/RnPicker'
import { useStore } from '../utils/useStore'
import { RnIcon, RnSwitch, RnText, RnTextInput, RnTouchableOpacity } from './Rn'
import { v } from './variables'

const css = StyleSheet.create({
  Field: {
    borderBottomWidth: 1,
    borderColor: v.borderBg,
    alignItems: 'stretch',
    marginHorizontal: 15,
    ...Platform.select({
      android: {
        paddingBottom: 2,
      },
    }),
  },
  Field__focusing: {
    backgroundColor: v.colors.primaryFn(0.5),
  },
  Field__disabled: {
    backgroundColor: v.hoverBg,
  },
  Field__group: {
    marginHorizontal: 0,
    marginTop: 15,
    backgroundColor: v.borderBg,
    padding: 15,
  },
  Field__groupMargin: {
    marginTop: 30,
  },
  Field__transparent: {
    borderColor: 'transparent',
    marginHorizontal: 0,
  },
  Field_Label: {
    paddingTop: 13,
    paddingBottom: 0,
    paddingLeft: 7,
    ...Platform.select({
      android: {
        paddingTop: 3,
        top: 6,
      },
      web: {
        // Fix form auto fill style on web
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
      },
    }),
  },
  Field_LabelText: {
    color: v.subColor,
    fontWeight: v.fontWeight,
  },
  Field_LabelTextGroup: {
    ...Platform.select({
      android: {
        top: -6,
      },
    }),
  },
  Field_TextInput: {
    width: '100%',
    paddingBottom: 3,
    paddingLeft: 7,
    paddingRight: 40,
    fontWeight: 'bold',
    overflow: 'hidden',
    ...Platform.select({
      android: {
        paddingTop: 0,
        paddingBottom: 0,
        lineHeight: v.lineHeight,
        // Should not set height and overflow here
        //    it will cause scroll issue with the input
        // height: g.lineHeight,
      },
      web: {
        // Fix form auto fill style on web
        paddingTop: 28,
      },
      default: {
        paddingTop: 1,
      },
    }),
  },
  Field_Switch: {
    position: 'absolute',
    top: 22,
    right: 11,
  },
  Field_Btn: {
    position: 'absolute',
    top: 11,
    right: 5,
    width: 40,
    height: 30,
    borderRadius: v.borderRadius,
  },
  Field_Btn__create: {
    backgroundColor: v.colors.primaryFn(0.5),
  },
  Field_Btn__remove: {
    backgroundColor: v.colors.dangerFn(0.5),
  },
  Field_Icon: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  Field_Error: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  Field_ErrorInner: {
    alignSelf: 'flex-start',
    marginVertical: 2,
    marginHorizontal: 15,
    paddingVertical: 2,
    paddingHorizontal: 10,
    backgroundColor: v.colors.danger,
    borderRadius: v.borderRadius,
  },
  Field_ErrorIcon: {
    position: 'absolute',
    top: -8,
    left: 2,
  },
  Field_ErrorLabel: {
    color: v.revColor,
  },
  Loading: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'black',
    opacity: 0.3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

const noop = () => {}

export const Field: FC<
  Partial<{
    isGroup: boolean
    hasMargin: boolean
    label: string
    onCreateBtnPress(): void
    onValueChange: Function
    createBtnStyle: TouchableOpacityProps['style']
    createBtnIcon: string
    createBtnIconStyle: ViewProps['style']
    removeBtnStyle: TouchableOpacityProps['style']
    removeBtnIcon: string
    removeBtnIconStyle: ViewProps['style']
    onRemoveBtnPress(): void
    type: 'Switch' | 'RnPicker'
    valueRender: Function
    value: string | boolean
    options: {
      key: string
      label: string
    }[]
    icon: string
    onBlur(): void
    onFocus(): void
    onSubmitEditing(): void
    style: TextInputProps['style']
    disabled: boolean
    inputElement: ReactElementLike | null
    onTouchPress(): void
    transparent: boolean
    secureTextEntry: boolean
    iconRender: Function
    error: string
    loading: boolean
  }>
> = observer(({ ...props }) => {
  if (props.isGroup) {
    return (
      <View
        style={[
          css.Field,
          css.Field__group,
          props.hasMargin && css.Field__groupMargin,
        ]}
      >
        <RnText small style={css.Field_LabelTextGroup}>
          {props.label}
        </RnText>
      </View>
    )
  }
  const $0 = useStore(() => ({
    observable: {
      isFocusing: false,
    },
  }))
  const $ = $0 as typeof $0 & {
    isFocusing: boolean
  }
  const inputRef = useRef<HTMLInputElement>()
  if (!inputRef.current && $.isFocusing) {
    $.set('isFocusing', false)
  }
  if (props.onCreateBtnPress) {
    Object.assign(props, {
      iconRender: () => (
        <RnTouchableOpacity
          onPress={props.onCreateBtnPress}
          style={[css.Field_Btn, css.Field_Btn__create, props.createBtnStyle]}
        >
          <RnIcon
            color={v.colors.primary}
            path={props.createBtnIcon || mdiPlus}
            size={18}
            style={props.createBtnIconStyle}
          />
        </RnTouchableOpacity>
      ),
    })
  }
  if (props.onRemoveBtnPress) {
    Object.assign(props, {
      iconRender: () => (
        <RnTouchableOpacity
          onPress={props.onRemoveBtnPress}
          style={[css.Field_Btn, css.Field_Btn__remove, props.removeBtnStyle]}
        >
          <RnIcon
            color={v.colors.danger}
            path={props.removeBtnIcon || mdiClose}
            size={15}
            style={props.removeBtnIconStyle}
          />
        </RnTouchableOpacity>
      ),
    })
  }
  if (props.onValueChange) {
    if (props.type === 'Switch') {
      Object.assign(props, {
        valueRender:
          props.valueRender ||
          ((e: boolean) => (e ? intl`Enabled` : intl`Disabled`)),
        iconRender: (e: boolean) => (
          <RnSwitch enabled={e} style={css.Field_Switch} />
        ),
        onTouchPress: () => {
          props.onValueChange?.(!props.value)
          Keyboard.dismiss()
        },
      })
    } else if (props.type === 'RnPicker') {
      Object.assign(props, {
        valueRender: (k: string) =>
          props.options?.find(o => o.key === k)?.label || k,
        onTouchPress: () => {
          RnPicker.open({
            options: props.options || [],
            selectedKey: props.value as string,
            onSelect: props.onValueChange as Function,
          })
          Keyboard.dismiss()
        },
        icon: props.icon || mdiUnfoldMoreHorizontal,
      })
    } else {
      Object.assign(props, {
        inputElement: (
          <RnTextInput
            ref={inputRef}
            {...omit(props, [
              'type',
              'label',
              'valueRender',
              'icon',
              'iconRender',
              'onValueChange',
              'onCreateBtnPress',
              'createBtnIcon',
              'onRemoveBtnPress',
              'removeBtnIcon',
              'disabled',
              'error',
            ])}
            onBlur={flow([
              () => $.set('isFocusing', false),
              props.onBlur || noop,
            ])}
            onChangeText={txt => props.onValueChange?.(txt)}
            onFocus={flow([
              () => $.set('isFocusing', true),
              props.onFocus || noop,
            ])}
            onSubmitEditing={flow([
              props.onCreateBtnPress || noop,
              props.onSubmitEditing || noop,
            ])}
            style={[css.Field_TextInput, props.style]}
            value={props.value as string}
          />
        ),
        onTouchPress: () => inputRef.current?.focus(),
      })
    }
  }
  if (props.disabled) {
    props.inputElement = null
    props.onTouchPress = undefined
  }
  const Container = props.onTouchPress ? RnTouchableOpacity : View
  const label = (
    <View pointerEvents='none' style={css.Field_Label}>
      <RnText small style={css.Field_LabelText}>
        {props.label}
      </RnText>
    </View>
  )
  return (
    <>
      <Container
        accessible={!props.inputElement}
        onPress={props.onTouchPress}
        style={[
          css.Field,
          $.isFocusing && css.Field__focusing,
          props.disabled && css.Field__disabled,
          props.transparent && css.Field__transparent,
        ]}
      >
        {/* Fix form auto fill style on web */}
        {Platform.OS !== 'web' && label}
        <View pointerEvents={($.isFocusing ? null : 'none') as any}>
          {props.inputElement || (
            <RnTextInput
              disabled
              secureTextEntry={!!(props.secureTextEntry && props.value)}
              style={css.Field_TextInput}
              value={
                (props.valueRender && props.valueRender(props.value)) ||
                props.value ||
                '\u200a'
              }
            />
          )}
          {!$.isFocusing && <View style={StyleSheet.absoluteFill} />}
        </View>
        {/* Fix form auto fill style on web */}
        {Platform.OS === 'web' && label}
        {(props.iconRender && props.iconRender(props.value)) ||
          (props.icon && (
            <RnIcon
              path={props.icon}
              pointerEvents='none'
              style={css.Field_Icon}
            />
          ))}
        {props.loading && (
          <View style={css.Loading}>
            <ActivityIndicator size='small' color='white' />
          </View>
        )}
      </Container>
      {props.error && (
        <RnTouchableOpacity
          onPress={() => inputRef.current?.focus()}
          style={css.Field_Error}
        >
          <View style={css.Field_ErrorInner}>
            <RnIcon
              color={v.colors.danger}
              path={mdiCardsDiamond}
              style={css.Field_ErrorIcon}
            />
            <RnText small style={css.Field_ErrorLabel}>
              {props.error}
            </RnText>
          </View>
        </RnTouchableOpacity>
      )}
    </>
  )
})
