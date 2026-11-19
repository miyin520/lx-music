import { memo } from 'react'

import CheckBoxItem from '../../components/CheckBoxItem'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { setFullscreen } from '@/utils/nativeModules/utils'
import { toast } from '@/utils/tools'

/**
 * 申请全面屏（沉浸式）
 *
 * 隐藏状态栏与底部手势条，让界面真正铺满表盘。
 * 系统栏一隐藏，窗口尺寸和安全区就变了，部分界面要重启后重新算一次才完全铺满，
 * 所以改完立刻生效，同时问一句要不要现在重启（跟改字体大小一个套路，重启是可选的）。
 */
export default memo(() => {
  const t = useI18n()
  const enabled = useSettingValue('common.watchFullscreen')

  const handleChange = (check: boolean) => {
    void updateSetting({ 'common.watchFullscreen': check })
    // 先立刻生效，让用户马上看到效果
    setFullscreen(check)
    // 直接生效，不再提示重启（实测不重启也没问题）
    toast(check ? t('setting_basic_fullscreen_on') : t('setting_basic_fullscreen_off'))
  }

  return (
    <>
      <CheckBoxItem
        check={enabled}
        label={t('setting_basic_fullscreen')}
        onChange={handleChange}
      />
    </>
  )
})
