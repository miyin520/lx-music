import { memo } from 'react'

import Section from '../../components/Section'
import IsSavePlayTime from './IsSavePlayTime'
import PlayHighQuality from './PlayHighQuality'
import IsHandleAudioFocus from './IsHandleAudioFocus'
import IsEnableAudioOffload from './IsEnableAudioOffload'
import IsAutoCleanPlayedList from './IsAutoCleanPlayedList'
import IsShowBluetoothLyric from './IsShowBluetoothLyric'
import IsShowBluetoothFullLyric from './IsShowBluetoothFullLyric'
import IsShowNotificationImage from './IsShowNotificationImage'
import IsShowLyricTranslation from './IsShowLyricTranslation'
import IsShowLyricRoma from './IsShowLyricRoma'
import IsS2T from './IsS2T'
import MaxCache from './MaxCache'
import { useI18n } from '@/lang'
import { isWatch } from '@/utils/watchMode'


export default memo(() => {
  const t = useI18n()
  // 表盘上没有通知栏、蓝牙歌词、音频卸载这些场景，相关开关直接不显示
  const hideOnWatch = isWatch()

  return (
    <Section title={t('setting_player')}>
      {/* 表盘上没有通知栏/蓝牙歌词/音频卸载这些场景，相关开关不显示 */}
      {hideOnWatch ? null : <IsSavePlayTime />}
      <IsAutoCleanPlayedList />
      <IsHandleAudioFocus />
      {hideOnWatch ? null : <IsEnableAudioOffload />}
      {hideOnWatch ? null : <IsShowBluetoothLyric />}
      {hideOnWatch ? null : <IsShowBluetoothFullLyric />}
      {hideOnWatch ? null : <IsShowNotificationImage />}
      <IsShowLyricTranslation />
      {hideOnWatch ? null : <IsShowLyricRoma />}
      {hideOnWatch ? null : <IsS2T />}
      <MaxCache />
      <PlayHighQuality />
    </Section>
  )
})
