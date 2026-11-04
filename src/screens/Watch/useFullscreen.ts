import { useEffect } from 'react'

import { useSettingValue } from '@/store/setting/hook'
import { setFullscreen } from '@/utils/nativeModules/utils'
import { windowSizeTools } from '@/utils/windowSizeTools'

/**
 * 申请 / 撤销全面屏
 *
 * 每个表盘页面都要调用：进播放页这类新页面时，系统栏可能会被重新显示出来，
 * 只在一个页面设一次不够（用户反馈「点了播放界面全面屏就失效」）。
 * 顺便在系统栏显隐后重算窗口尺寸，避免布局按旧尺寸排。
 */
export const useWatchFullscreen = () => {
  const fullscreen = useSettingValue('common.watchFullscreen')

  useEffect(() => {
    setFullscreen(fullscreen)
    // 系统栏显隐后可用窗口会变，稍后重算一次尺寸
    const timer = setTimeout(() => { void windowSizeTools.refresh() }, 400)
    return () => { clearTimeout(timer) }
  }, [fullscreen])
}
