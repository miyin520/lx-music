import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import CheckBox from './Checkbox'

import { createStyle, tipDialog } from '@/utils/tools'
import { scaleSizeH, scaleSizeW, setSpText } from '@/utils/pixelRatio'
import { isWatch } from '@/utils/watchMode'
import { useTheme } from '@/store/theme/hook'
import Text from '../Text'
import { Icon } from '../Icon'

export interface CheckBoxProps {
  check: boolean
  label?: string
  children?: React.ReactNode
  onChange: (check: boolean) => void
  disabled?: boolean
  need?: boolean
  size?: number
  marginRight?: number
  marginBottom?: number

  helpTitle?: string
  helpDesc?: string
}

export default ({ check, label, children, onChange, helpTitle, helpDesc, disabled = false, need = false, marginRight = 0, marginBottom = 0, size = 1 }: CheckBoxProps) => {
  const theme = useTheme()
  const [isDisabled, setDisabled] = useState(false)
  const tintColors = {
    true: theme['c-primary'],
    false: theme['c-600'],
  }
  const disabledTintColors = {
    true: theme['c-primary-alpha-600'],
    false: theme['c-400'],
  }

  useEffect(() => {
    if (need) {
      if (check) {
        if (!isDisabled) setDisabled(true)
      } else {
        if (isDisabled) setDisabled(false)
      }
    } else {
      isDisabled && setDisabled(false)
    }
  }, [check, need, isDisabled])

  const handleLabelPress = useCallback(() => {
    if (isDisabled) return
    onChange?.(!check)
  }, [isDisabled, onChange, check])

  const helpComponent = useMemo(() => {
    const handleShowHelp = () => {
      void tipDialog({
        title: helpTitle ?? '',
        message: helpDesc,
        btnText: global.i18n.t('understand'),
      })
    }
    return (helpTitle ?? helpDesc) ? (
      <TouchableOpacity style={styles.helpBtn} onPress={handleShowHelp}>
        <Icon size={15 * size} name="help" />
      </TouchableOpacity>
    ) : null
  }, [helpTitle, helpDesc, size])


  const contentStyle = { ...styles.content, marginBottom: scaleSizeH(marginBottom), paddingVertical: isWatch() ? 6 : 0 }
  const labelStyle = { ...styles.label, marginRight: scaleSizeW(marginRight) }
  // 让勾选框的中心对齐「标签文字首行」的中心：
  // 之前只靠 flex-start 对齐顶部，视觉上会偏低几个 dp。
  const labelFontSize = setSpText(15 * size)
  const labelLineHeight = isWatch() ? Math.ceil(labelFontSize * 1.38) : labelFontSize * 1.2
  // 表盘上默认 24dp 的勾选框偏小，手指也不容易点准，整体放大一档
  const boxScale = isWatch() ? 1.35 : 1
  const iconSize = 24 * size * boxScale
  const checkOffset = (labelLineHeight - iconSize) / 2

  return (
    disabled
      ? (
          <View style={contentStyle}>
            <View style={{ marginTop: checkOffset }}>
              <CheckBox status={check ? 'checked' : 'unchecked'} disabled={true} tintColors={disabledTintColors} size={size * boxScale} />
            </View>
            <View style={labelStyle}>{label ? <Text style={styles.name} color={theme['c-500']} size={15 * size}>{label}</Text> : children}</View>
            {helpComponent}
          </View>
        )
      : (
          <View style={contentStyle}>
            <View style={{ marginTop: checkOffset }}>
              <CheckBox status={check ? 'checked' : 'unchecked'} disabled={isDisabled} onPress={handleLabelPress} tintColors={tintColors} size={size * boxScale} />
            </View>
            <TouchableOpacity style={labelStyle} activeOpacity={0.3} onPress={handleLabelPress}>
              {label ? <Text style={styles.name} size={15 * size}>{label}</Text> : children}
            </TouchableOpacity>
            {helpComponent}
          </View>
        )
  )
}

const styles = createStyle({
  content: {
    flexGrow: 0,
    flexShrink: 1,
    marginRight: 15,
    // 表盘上字号大、屏幕窄：顶部对齐 + 允许换行，长文字才不会被截断；
    // 手机上也改成顶部对齐，勾选框会落在文字行的上方而不是竖直居中
    alignItems: 'flex-start',
    flexDirection: 'row',
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  checkbox: {
    flex: 0,
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  label: {
    flexGrow: 0,
    flexShrink: 1,
    // marginRight: 15,
    // alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.2)',
    paddingRight: 3,
  },
  name: {
    marginTop: 2,
    // 允许换行并预留行高，字号调大后下半部分不会被切
    flexShrink: 1,
  },
  helpBtn: {
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
})

