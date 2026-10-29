import { memo } from 'react'

import CheckBoxItem from '../../components/CheckBoxItem'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'

/** 侧边栏底部「退出」按钮开关：关掉后导航栏不再显示退出入口 */
export default memo(() => {
  const t = useI18n()
  const enabled = useSettingValue('common.watchRailExit')

  return (
    <CheckBoxItem
      check={enabled}
      label={t('setting_basic_rail_exit')}
      onChange={(check) => { updateSetting({ 'common.watchRailExit': check }) }}
    />
  )
})
