import { windowSizeTools } from '@/utils/windowSizeTools'

const defaultSetting: LX.AppSetting = {
  version: '2.0',
  'common.isAutoTheme': false,
  'common.langId': null,
  'common.apiSource': '',
  'common.sourceNameType': 'alias',
  'common.shareType': 'system',
  'common.isAgreePact': false,
  'common.autoHidePlayBar': true,
  'common.drawerLayoutPosition': 'left',
  'common.homePageScroll': true,
  'common.allowProgressBarSeek': true,
  'common.showBackBtn': false,
  'common.showExitBtn': true,
  'common.useSystemFileSelector': true,
  'common.alwaysKeepStatusbarHeight': false,
  // 圆角屏（手表）四周留白，0 = 关闭
  'common.watchScreenInset': 0,
  // 界面形态：auto = 按屏幕尺寸自动识别；phone / watch = 用户手动指定
  'common.watchRailSide': 'left',
  'common.watchRailExit': true,
  'common.watchRailScale': 'normal',

  'player.startupAutoPlay': false,
  'player.startupPushPlayDetailScreen': false,
  'player.togglePlayMethod': 'listLoop',
  'player.playQuality': '128k',
  'player.isSavePlayTime': false,
  'player.volume': 1,
  'player.playbackRate': 1,
  'player.cacheSize': '1024',
  'player.timeoutExit': '',
  'player.timeoutExitPlayed': true,
  'player.isAutoCleanPlayedList': false,
  'player.isHandleAudioFocus': true,
  'player.isEnableAudioOffload': true,
  'player.isShowLyricTranslation': false,
  'player.isShowLyricRoma': false,
  'player.isShowNotificationImage': true,
  'player.isS2t': false,
  'player.isShowBluetoothLyric': false,
  'player.isShowBluetoothFullLyric': false,

  // 'playDetail.isZoomActiveLrc': false,
  // 'playDetail.isShowLyricProgressSetting': false,
  'playDetail.style.align': 'left',
  'playDetail.vertical.style.lrcFontSize': 210,
  'playDetail.horizontal.style.lrcFontSize': 220,
  'playDetail.isShowLyricProgressSetting': false,

  'desktopLyric.enable': false,
  'desktopLyric.isLock': false,
  'desktopLyric.width': 100,
  'desktopLyric.maxLineNum': 5,
  'desktopLyric.isSingleLine': false,
  'desktopLyric.showToggleAnima': true,
  'desktopLyric.position.x': 0,
  'desktopLyric.position.y': 0,
  'desktopLyric.textPosition.x': 'left',
  'desktopLyric.textPosition.y': 'top',
  'desktopLyric.style.fontSize': 180,
  'desktopLyric.style.opacity': 100,
  'desktopLyric.style.lyricUnplayColor': 'rgba(255, 255, 255, 1)',
  'desktopLyric.style.lyricPlayedColor': 'rgba(7, 197, 86, 1)',
  'desktopLyric.style.lyricShadowColor': 'rgba(0, 0, 0, 0.6)',

  'search.isShowHotSearch': false,
  'search.isShowHistorySearch': false,

  'list.isClickPlayList': false,
  'list.isShowSource': true,
  'list.isShowAlbumName': false,
  'list.isShowInterval': true,
  'list.isSaveScrollLocation': true,
  'list.addMusicLocationType': 'top',

  'download.fileName': '歌名 - 歌手',

  'sync.enable': false,

  // 'theme.id': 'blue_plus',
  'theme.id': 'green',
  'theme.lightId': 'green',
  'theme.darkId': 'black',
  'theme.hideBgDark': false,
  'theme.dynamicBg': false,
  'theme.fontShadow': false,
}


// 使用新年皮肤
if (new Date().getMonth() < 2) {
  defaultSetting['theme.id'] = 'happy_new_year'
  defaultSetting['desktopLyric.style.lyricPlayedColor'] = 'rgba(255, 18, 34, 1)'
}

// 小屏（手表）默认值：为 400~520dp 的圆形/方形表盘做一次初始设定，
// 用户之后仍可在设置里改回来。
const winSize = windowSizeTools.getSize()
if (winSize.width && winSize.height) {
  const w = Math.min(winSize.width, winSize.height)
  const diag = Math.sqrt(winSize.width * winSize.width + winSize.height * winSize.height)
  if (w < 460 && diag < 660) {
    defaultSetting['common.drawerLayoutPosition'] = 'left'
    defaultSetting['common.homePageScroll'] = true
    defaultSetting['player.startupPushPlayDetailScreen'] = false
    defaultSetting['player.isShowNotificationImage'] = false
    defaultSetting['list.isShowSource'] = false
    defaultSetting['list.isShowInterval'] = false
    // 歌词居中：表盘两侧是圆角，左对齐容易被切
    defaultSetting['playDetail.style.align'] = 'center'
    defaultSetting['playDetail.vertical.style.lrcFontSize'] = 150
    defaultSetting['playDetail.horizontal.style.lrcFontSize'] = 150
    defaultSetting['theme.dynamicBg'] = false
    defaultSetting['theme.fontShadow'] = false
    defaultSetting['search.isShowHotSearch'] = false
    defaultSetting['search.isShowHistorySearch'] = false
    defaultSetting['desktopLyric.enable'] = false
    // 圆角屏上下留白：默认「大」（30dp），用户可在设置里调
    // 默认值与设置项里的档位保持一致（大 = 36dp），否则设置页一项都不会被勾选
    defaultSetting['common.watchScreenInset'] = 36
    // 手表上进度条极易误触，默认改成「点哪都进播放页」
    defaultSetting['common.allowProgressBarSeek'] = false
  }
}

export default defaultSetting
