import { memo, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'

const LIST = [
  { inset: 0, name: 'setting_basic_watch_inset_0' },
  { inset: 12, name: 'setting_basic_watch_inset_12' },
  { inset: 24, name: 'setting_basic_watch_inset_24' },
  { inset: 36, name: 'setting_basic_watch_inset_36' },
] as const

type INSET_TYPE = typeof LIST[number]['inset']

const Item = ({ inset, label, active }: {
  inset: INSET_TYPE
  label: string
  active: boolean
}) => {
  return <CheckBox
    marginRight={8}
    check={active}
    label={label}
    onChange={() => { updateSetting({ 'common.watchScreenInset': inset }) }}
    need
  />
}

export default memo(() => {
  const t = useI18n()
  const current = useSettingValue('common.watchScreenInset')
  // 取最接近的档位作为选中项：历史版本存过 30 这种非档位值，
  // 直接用 === 会导致一个选项都不勾选（用户反馈"实际生效但设置没显示开启"）
  const nearest = useMemo(() => {
    let best = LIST[0].inset as number
    for (const item of LIST) {
      if (Math.abs(item.inset - current) < Math.abs(best - current)) best = item.inset
    }
    return best
  }, [current])
  const list = useMemo(() => LIST.map((item) => ({ inset: item.inset, name: t(item.name) })), [t])

  return (
    <SubTitle title={t('setting_basic_watch_inset')}>
      <View style={styles.list}>
        {
          list.map(({ inset, name }) => (
            <Item key={inset} inset={inset} label={name} active={nearest == inset} />
          ))
        }
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
