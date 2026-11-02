import { memo, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import Input from '@/components/common/Input'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

/**
 * 表盘圆角半径
 *
 * 圆角很大的表盘会把贴边的文字切掉（搜索框第一行、导航栏最上/最下）。
 * Android 12 及以上能向系统读真实半径，但大部分手表还在 12 以下 —— 读不到，
 * 所以这里让用户直接填：点一下输入框就会弹键盘。
 *
 * 值 = 圆角半径（dp）：
 *  -1（或留空）= 自动（读系统值，读不到按屏幕尺寸估算）
 *   0         = 方角屏，不做避让
 *  1~150      = 按填的半径避让
 */
const MAX = 150

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const current = useSettingValue('common.watchCornerRadius')
  const [text, setText] = useState('')
  const editingRef = useRef(false)

  // 外部值变化时同步输入框（正在输入时不要打断用户）
  useEffect(() => {
    if (editingRef.current) return
    setText(current >= 0 ? String(current) : '')
  }, [current])

  const commit = (raw: string) => {
    editingRef.current = false
    const trimmed = raw.trim()
    // 留空 = 自动
    if (!trimmed) {
      setText('')
      if (current !== -1) updateSetting({ 'common.watchCornerRadius': -1 })
      return
    }
    const num = Number(trimmed)
    if (!Number.isFinite(num)) {
      // 非法输入：还原成当前值
      setText(current >= 0 ? String(current) : '')
      return
    }
    const value = num < 0 ? -1 : Math.min(Math.round(num), MAX)
    setText(value >= 0 ? String(value) : '')
    if (value !== current) updateSetting({ 'common.watchCornerRadius': value })
  }

  return (
    <SubTitle title={t('setting_basic_watch_corner')}>
      <View style={[styles.row, { borderColor: theme['c-border-background'] }]}>
        <Input
          value={text}
          onChangeText={setText}
          onFocus={() => { editingRef.current = true }}
          onBlur={() => { commit(text) }}
          onSubmitEditing={() => { commit(text) }}
          placeholder={t('setting_basic_watch_corner_auto')}
          // 点一下就会弹键盘（数字键盘）
          keyboardType="number-pad"
          returnKeyType="done"
          style={styles.input}
          clearBtn
        />
        <Text size={12} color={theme['c-350']} style={styles.unit}>dp</Text>
      </View>
    </SubTitle>
  )
})

const styles = createStyle({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingRight: 10,
    width: 140,
    maxWidth: '92%',
  },
  input: {
    fontSize: 14,
  },
  unit: {
    marginLeft: 6,
  },
})
