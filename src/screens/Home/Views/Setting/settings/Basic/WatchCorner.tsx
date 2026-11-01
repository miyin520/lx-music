import { memo, useMemo } from 'react'
import { View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'

/**
 * 表盘圆角半径
 *
 * 圆角很大的表盘会把贴边的文字切掉（搜索框第一行、导航栏最上/最下）。
 * Android 12 及以上能从系统读到真实半径，但大部分手表还在 12 以下 —— 读不到，
 * 所以这里给一个手动档：选了值就按它避让，选「自动」才走系统值 / 尺寸估算。
 *
 * 值 = 圆角半径（dp），-1 表示自动。
 */
const LIST = [
  { value: -1, name: 'setting_basic_watch_corner_auto' },
  { value: 0, name: null },
  { value: 24, name: null },
  { value: 40, name: null },
  { value: 56, name: null },
  { value: 72, name: null },
] as const

const Item = ({ value, label, active }: {
  value: number
  label: string
  active: boolean
}) => {
  return <CheckBox
    marginRight={8}
    check={active}
    label={label}
    onChange={() => { updateSetting({ 'common.watchCornerRadius': value }) }}
    need
  />
}

export default memo(() => {
  const t = useI18n()
  const current = useSettingValue('common.watchCornerRadius')
  // 历史值可能不在档位里：取最接近的一档显示，避免一个都不勾选
  const nearest = useMemo(() => {
    let best = LIST[0].value as number
    for (const item of LIST) {
      if (Math.abs(item.value - current) < Math.abs(best - current)) best = item.value
    }
    return best
  }, [current])
  const list = useMemo(() => LIST.map(item => ({
    value: item.value,
    label: item.name ? t(item.name) : String(item.value),
  })), [t])

  return (
    <SubTitle title={t('setting_basic_watch_corner')}>
      <View style={styles.list}>
        {
          list.map(({ value, label }) => (
            <Item key={value} value={value} label={label} active={nearest == value} />
          ))
        }
      </View>
      <Text style={styles.tip} size={12}>{t('setting_basic_watch_corner_tip')}</Text>
    </SubTitle>
  )
})

const styles = createStyle({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tip: {
    marginTop: 8,
    opacity: 0.6,
  },
})
