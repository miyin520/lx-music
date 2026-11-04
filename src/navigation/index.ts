import { Navigation } from 'react-native-navigation'
import * as screenNames from './screenNames'
import * as navigations from './navigation'

import registerScreens from './registerScreens'
import settingState from '@/store/setting/state'
import { removeComponentId } from '@/core/common'
import { onAppLaunched } from './regLaunchedEvent'

let unRegisterEvent: ReturnType<ReturnType<typeof Navigation.events>['registerScreenPoppedListener']>

const init = (callback: () => void | Promise<void>) => {
  // Register all screens on launch
  registerScreens()

  if (unRegisterEvent) unRegisterEvent.remove()

  Navigation.setDefaultOptions({
    // 系统栏默认跟随「申请全面屏」这个设置，避免每次 push 页面被 RNN 重新打开
    statusBar: {
      drawBehind: true,
      visible: !settingState.setting['common.watchFullscreen'],
    },
    navigationBar: {
      visible: !settingState.setting['common.watchFullscreen'],
    },
  })
  unRegisterEvent = Navigation.events().registerScreenPoppedListener(({ componentId }) => {
    removeComponentId(componentId)
  })
  onAppLaunched(() => {
    console.log('Register app launched listener')
    void callback()
  })
}

export * from './utils'
export * from './event'
export * from './hooks'

export {
  init,
  screenNames,
  navigations,
}
