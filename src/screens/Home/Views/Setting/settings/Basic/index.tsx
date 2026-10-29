import { memo } from 'react'

import Theme from '../Theme'
import Section from '../../components/Section'
import Source from './Source'
import SourceName from './SourceName'
import Language from './Language'
import FontSize from './FontSize'
import IsUseSystemFileSelector from './IsUseSystemFileSelector'
import DrawerLayoutPosition from './DrawerLayoutPosition'
import WatchScreenInset from './WatchScreenInset'
import WatchRail from './WatchRail'
import IsShowRailExit from './IsShowRailExit'
import { useI18n } from '@/lang/i18n'

export default memo(() => {
  const t = useI18n()


  return (
    <Section title={t('setting_basic')}>
      <IsUseSystemFileSelector />
      <Theme />
      <DrawerLayoutPosition />
      <Language />
      <FontSize />
      <WatchScreenInset />
      <WatchRail />
      <IsShowRailExit />
      <Source />
      <SourceName />
    </Section>
  )
})
