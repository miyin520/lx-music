import { forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react'
import { ScrollView, View } from 'react-native'
import { PopupScrollLockContext } from './scrollLock'
import Popup, { type PopupType, type PopupProps } from '@/components/common/Popup'
import { useI18n } from '@/lang'

import SettingLyricProgress from './settings/SettingLyricProgress'
import SettingVolume from './settings/SettingVolume'
import SettingPlaybackRate from './settings/SettingPlaybackRate'
import SettingLrcFontSize from './settings/SettingLrcFontSize'
import SettingLrcAlign from './settings/SettingLrcAlign'
import SettingWatchFullscreen from './settings/SettingWatchFullscreen'

export interface SettingPopupProps extends Omit<PopupProps, 'children'> {
  direction: 'vertical' | 'horizontal'
}

export interface SettingPopupType {
  show: () => void
}

export default forwardRef<SettingPopupType, SettingPopupProps>(({ direction, ...props }, ref) => {
  const [visible, setVisible] = useState(false)
  // 拖滑条时临时关掉面板滚动，避免和原生 Slider 抢手势导致整屏卡死
  const [scrollEnabled, setScrollEnabled] = useState(true)
  const handleScrollLock = useCallback((locked: boolean) => { setScrollEnabled(!locked) }, [])
  const popupRef = useRef<PopupType>(null)
  // console.log('render import export')
  const t = useI18n()

  useImperativeHandle(ref, () => ({
    show() {
      if (visible) popupRef.current?.setVisible(true)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          popupRef.current?.setVisible(true)
        })
      }
    },
  }))


  return (
    visible
      ? (
        <Popup ref={popupRef} title={t('play_detail_setting_title')} {...props}>
          <PopupScrollLockContext.Provider value={handleScrollLock}>
          <ScrollView scrollEnabled={scrollEnabled} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* 这层 View 原来用 onStartShouldSetResponder 抢 responder，
                会让面板里的勾选框完全点不动（滑条不受影响），所以去掉 */}
            <View>
              <SettingLyricProgress />
              <SettingVolume />
              <SettingPlaybackRate />
              <SettingLrcFontSize direction={direction} />
              <SettingLrcAlign />
              <SettingWatchFullscreen />
            </View>
          </ScrollView>
          </PopupScrollLockContext.Provider>
        </Popup>
        )
      : null
  )
})
