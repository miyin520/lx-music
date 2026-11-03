import { memo } from 'react'
import { Alert } from 'react-native'

import CheckBoxItem from '../../components/CheckBoxItem'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { setFullscreen, restartApp } from '@/utils/nativeModules/utils'

/**
 * 申请全面屏（沉浸式）
 *
 * 隐藏状态栏与底部手势条，让界面真正铺满表盘。
 * 系统栏一隐藏，窗口尺寸和安全区就变了，部分界面要重启后重新算一次才完全铺满，
 * 所以改完立刻生效，同时问一句要不要现在重启（跟改字体大小一个套路，重启是可选的）。
 */
const confirmRestart = (title: string, message: string, okText: string, cancelText: string) => new Promise<boolean>((resolve) => {
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel', onPress: () => { resolve(false) } },
    { text: okText, onPress: () => { resolve(true) } },
  ], {
    cancelable: true,
    onDismiss: () => { resolve(false) },
  })
})

export default memo(() => {
  const t = useI18n()
  const enabled = useSettingValue('common.watchFullscreen')

  const handleChange = (check: boolean) => {
    void updateSetting({ 'common.watchFullscreen': check })
    // 先立刻生效，让用户马上看到效果
    setFullscreen(check)
    void confirmRestart(
      t('setting_basic_fullscreen_changed'),
      t('setting_basic_fullscreen_tip'),
      t('setting_basic_fullscreen_restart'),
      t('setting_basic_fullscreen_later'),
    ).then((ok) => {
      if (ok) restartApp()
    })
  }

  return (
    <CheckBoxItem
      check={enabled}
      label={t('setting_basic_fullscreen')}
      onChange={handleChange}
    />
  )
})
