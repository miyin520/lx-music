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
  const list = useMemo(() => LIST.map((item) => ({ inset: item.inset, name: t(item.name) })), [t])

  return (
    <SubTitle title={t('setting_basic_watch_inset')}>
      <View style={styles.list}>
        {
          list.map(({ inset, name }) => (
            <Item key={inset} inset={inset} label={name} active={current == inset} />
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
