import { memo, useMemo } from 'react'
import { View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'

/**
 * 手表左侧导航栏设置
 * - 上下留白：独立于全局「上下留白」，因为导航栏常贴边，需求不一样
 * - 位置：左侧 / 右侧
 */
const SideItem = ({ side, label, active }: {
  side: 'left' | 'right'
  label: string
  active: boolean
}) => (
  <CheckBox
    marginRight={8}
    check={active}
    label={label}
    onChange={() => { updateSetting({ 'common.watchRailSide': side }) }}
    need
  />
)

export default memo(() => {
  const t = useI18n()
  const side = useSettingValue('common.watchRailSide')


  return (
    <>
      <SubTitle title={t('setting_basic_watch_rail_side')}>
        <View style={styles.list}>
          <SideItem side="left" label={t('setting_basic_watch_rail_side_left')} active={side == 'left'} />
          <SideItem side="right" label={t('setting_basic_watch_rail_side_right')} active={side == 'right'} />
        </View>
      </SubTitle>
    </>
  )
})

const styles = createStyle({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
