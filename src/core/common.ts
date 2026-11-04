import { hideDesktopLyric } from './desktopLyric'
import { exitApp as utilExitApp } from '@/utils/nativeModules/utils'
import { destroy as destroyPlayer } from '@/plugins/player/utils'
import { initSetting as initAppSetting } from '@/config/setting'
import { setLanguage as applyLanguage } from '@/lang/i18n'

import settingActions from '@/store/setting/action'
import settingState from '@/store/setting/state'
import commonActions from '@/store/common/action'
import commonState, { type InitState as CommonStateType } from '@/store/common/state'

import { storageDataPrefix } from '@/config/constant'
import { refreshPixelRatio } from '@/utils/pixelRatio'
import { saveData } from '@/plugins/storage'
import { throttle } from '@/utils/common'
import { getSelectedManagedFolder, saveFontSize, saveViewPrevState, setSelectedManagedFolder } from '@/utils/data'
import { showPactModal as handleShowPactModal } from '@/navigation'
import { hideDesktopLyricView } from '@/utils/nativeModules/lyricDesktop'
import { getPersistedUriList, selectManagedFolder } from '@/utils/fs'


/**
 * 已经删掉的设置项。
 *
 * 这些设置在界面上早就没有入口了，代码里可能还留着默认值兜底，
 * 但没必要继续写进硬盘（手表存储寸土寸金，也免得旧值一直挂着）。
 * 保存前统一剔除，下次保存时就顺手把旧文件里的这些键清掉。
 */
const OBSOLETE_SETTING_KEYS = [
  'common.shareType',
  'common.autoHidePlayBar',
  'common.homePageScroll',
  'common.allowProgressBarSeek',
  'common.showBackBtn',
  'common.showExitBtn',
  'common.alwaysKeepStatusbarHeight',
  'common.watchRailScale',
  'common.watchScreenInset',
  'common.sourceNameType',
  'player.startupAutoPlay',
  'player.startupPushPlayDetailScreen',
  'player.isSavePlayTime',
  'player.isEnableAudioOffload',
  'player.isShowLyricRoma',
  'player.isS2t',
  'player.isShowBluetoothLyric',
  'player.isShowBluetoothFullLyric',
  'player.isShowNotificationImage',
  'theme.dynamicBg',
  'theme.fontShadow',
  'list.isShowSource',
  'list.isSaveScrollLocation',
] as const

const omitObsoleteSetting = (setting: LX.AppSetting): LX.AppSetting => {
  const copy: Record<string, unknown> = { ...setting }
  for (const key of OBSOLETE_SETTING_KEYS) delete copy[key]
  return copy as unknown as LX.AppSetting
}

const throttleSaveSetting = throttle(() => {
  void saveData(storageDataPrefix.setting, omitObsoleteSetting(settingState.setting))
})

/**
 * 初始化设置
 */
export const initSetting = async() => {
  const setting = (await initAppSetting()).setting
  settingActions.updateSetting(setting)
  // 启动时写一次：把旧版本残留的、已经删掉的设置键从硬盘里清出去
  throttleSaveSetting()
  return setting
}

/**
 * 更新设置
 * @param setting 新设置
 */
export const updateSetting = (setting: Partial<LX.AppSetting>) => {
  settingActions.updateSetting(setting)
  throttleSaveSetting()
}

export const setLanguage = (locale: Parameters<typeof applyLanguage>[0]) => {
  updateSetting({ 'common.langId': locale })
  global.state_event.languageChanged(locale)
  requestAnimationFrame(() => {
    applyLanguage(locale)
  })
}


let isDestroying = false
export const exitApp = (reason: string) => {
  console.log('Handle Exit App, Reason: ' + reason)
  if (isDestroying) return
  isDestroying = true
  void Promise.all([
    hideDesktopLyric(),
    destroyPlayer(),
    hideDesktopLyricView(),
  ]).finally(() => {
    isDestroying = false
    utilExitApp()
  })
}

export const setFontSize = (size: number) => {
  // 必须先同步到全局：getTextSize() 读的就是 global.lx.fontSize，
  // 之前这里只更新 store，导致改字号后所有文本尺寸不变。
  global.lx.fontSize = size
  commonActions.setFontSize(size)
  refreshPixelRatio()
  // 通知所有订阅了配置更新的组件重绘 —— 字号要**立即生效**，不是重启后生效
  global.state_event.configUpdated([], {})
  void saveFontSize(size)
}

export const setStatusbarHeight = (size: number) => {
  commonActions.setStatusbarHeight(size)
}

export const setComponentId = (name: keyof CommonStateType['componentIds'], id: string) => {
  commonActions.setComponentId(name, id)
}
export const removeComponentId = (name: string) => {
  commonActions.removeComponentId(name)
}

export const setNavActiveId = (id: Parameters<typeof commonActions.setNavActiveId>['0']) => {
  if (id == commonState.navActiveId) return
  commonActions.setNavActiveId(id)
  if (id != 'nav_setting') {
    commonActions.setLastNavActiveId(id)
    saveViewPrevState({ id })
  }
}

export const showPactModal = () => {
  handleShowPactModal()
}

export const checkStoragePermissions = async() => {
  const selectedManagedFolder = await getSelectedManagedFolder()
  if (selectedManagedFolder) return (await getPersistedUriList()).some(uri => selectedManagedFolder.startsWith(uri))
  return false
}

export const requestStoragePermission = async() => {
  const isGranted = await checkStoragePermissions()
  if (isGranted) return isGranted

  const uri = await selectManagedFolder()
  if (!uri.isDirectory) return false
  await setSelectedManagedFolder(uri.path)
  return true
}

export const setBgPic = (pic: string | null) => {
  commonActions.setBgPic(pic)
}
