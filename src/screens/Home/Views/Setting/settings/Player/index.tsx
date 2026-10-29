import { memo } from 'react'

import Section from '../../components/Section'
import PlayHighQuality from './PlayHighQuality'
import IsHandleAudioFocus from './IsHandleAudioFocus'
import IsAutoCleanPlayedList from './IsAutoCleanPlayedList'
import IsShowLyricTranslation from './IsShowLyricTranslation'
import MaxCache from './MaxCache'
import { useI18n } from '@/lang'


export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_player')}>
      <IsAutoCleanPlayedList />
      <IsHandleAudioFocus />
      <IsShowLyricTranslation />
      <MaxCache />
      <PlayHighQuality />
    </Section>
  )
})
