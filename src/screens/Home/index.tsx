import { useEffect } from 'react'
import { isWatch } from '@/utils/watchMode'
import WatchHome from '@/screens/Watch/Home'
import PageContent from '@/components/PageContent'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import Vertical from './Vertical'
import { navigations } from '@/navigation'
import settingState from '@/store/setting/state'


interface Props {
  componentId: string
}


export default ({ componentId }: Props) => {
  useEffect(() => {
    setComponentId(COMPONENT_IDS.home, componentId)
    // eslint-disable-next-line react-hooks/exhaustive-deps

    if (settingState.setting['player.startupPushPlayDetailScreen']) {
      navigations.pushPlayDetailScreen(componentId, true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 手表：完全走专属界面，不再套手机版的抽屉/双列布局
  if (isWatch()) return <WatchHome componentId={componentId} />

  return (
    <PageContent>
      {
        <Vertical />
      }
    </PageContent>
  )
}
