import { memo } from 'react'

import Theme from '../Theme'
import Section from '../../components/Section'
import Source from './Source'
import Language from './Language'
import FontSize from './FontSize'
import IsUseSystemFileSelector from './IsUseSystemFileSelector'
import DrawerLayoutPosition from './DrawerLayoutPosition'
import WatchCorner from './WatchCorner'
import IsFullscreen from './IsFullscreen'
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
      <WatchCorner />
      <IsFullscreen />
      <WatchRail />
      <IsShowRailExit />
      <Source />
    </Section>
  )
})
