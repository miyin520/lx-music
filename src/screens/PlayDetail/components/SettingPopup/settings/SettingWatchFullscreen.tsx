import { useState } from 'react'

import { View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import CheckBox from '@/components/common/CheckBox'
import Slider, { type SliderProps } from '@/components/common/Slider'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import styles from './style'

/**
 * 歌曲界面全屏
 *
 * 手表屏幕小，正常播放页的歌词被上下控件挤在中间。开启后点击歌词页
 * 会进入纯歌词界面（只剩歌词，当前行高亮），N 秒后自动退出。
 */
const SettingWatchFullscreen = () => {
  const theme = useTheme()
  const t = useI18n()
  const enabled = useSettingValue('playDetail.isWatchFullscreenLyric')
  const timeout = useSettingValue('playDetail.watchFullscreenLyricTimeout')
  const [sliderValue, setSliderValue] = useState(timeout)
  const [isSliding, setSliding] = useState(false)

  const handleValueChange: SliderProps['onValueChange'] = (value) => {
    setSliding(true)
    setSliderValue(Math.trunc(value))
  }
  const handleSlidingComplete: SliderProps['onSlidingComplete'] = (value) => {
    setSliding(false)
    const next = Math.min(Math.max(Math.trunc(value), 3), 10)
    setSliderValue(next)
    if (next != timeout) updateSetting({ 'playDetail.watchFullscreenLyricTimeout': next })
  }

  return (
    <View style={styles.container}>
      <CheckBox
        check={enabled}
        label={t('play_detail_setting_watch_fullscreen')}
        onChange={(check) => { updateSetting({ 'playDetail.isWatchFullscreenLyric': check }) }}
        need
      />
      { enabled
        ? (
            <View style={styles.content}>
              <Text>{t('play_detail_setting_watch_fullscreen_timeout')}</Text>
              <View style={styles.content}>
                <Text style={styles.label} color={theme['c-font-label']}>{isSliding ? sliderValue : timeout}</Text>
                <Slider
                  minimumValue={3}
                  maximumValue={10}
                  step={1}
                  value={timeout}
                  onSlidingStart={() => { setSliding(true) }}
                  onValueChange={handleValueChange}
                  onSlidingComplete={handleSlidingComplete}
                />
              </View>
            </View>
          )
        : null }
    </View>
  )
}

export default SettingWatchFullscreen
