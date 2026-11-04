import { memo, useRef } from 'react'

import CheckBoxItem from '../../components/CheckBoxItem'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { setFullscreen, restartApp } from '@/utils/nativeModules/utils'
import ConfirmDialog, { type ConfirmType } from '@/screens/Watch/ConfirmDialog'

/**
 * 申请全面屏（沉浸式）
 *
 * 隐藏状态栏与底部手势条，让界面真正铺满表盘。
 * 系统栏一隐藏，窗口尺寸和安全区就变了，部分界面要重启后重新算一次才完全铺满，
 * 所以改完立刻生效，同时问一句要不要现在重启（跟改字体大小一个套路，重启是可选的）。
 */
export default memo(() => {
  const t = useI18n()
  const confirmRef = useRef<ConfirmType>(null)
  const enabled = useSettingValue('common.watchFullscreen')

  const handleChange = (check: boolean) => {
    void updateSetting({ 'common.watchFullscreen': check })
    // 先立刻生效，让用户马上看到效果
    setFullscreen(check)
    void confirmRef.current?.show({
      title: t('setting_basic_fullscreen_changed'),
      message: t('setting_basic_fullscreen_tip'),
      okText: t('setting_basic_fullscreen_restart'),
      cancelText: t('setting_basic_fullscreen_later'),
    }).then((ok) => {
      if (ok) restartApp()
    })
  }

  return (
    <>
      <CheckBoxItem
        check={enabled}
        label={t('setting_basic_fullscreen')}
        onChange={handleChange}
      />
      <ConfirmDialog ref={confirmRef} />
    </>
  )
})
