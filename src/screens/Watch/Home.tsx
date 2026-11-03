/**
 * 手表首页：左侧常驻导航栏 + 右侧内容区
 *
 * 关键设计：导航栏**一直显示**，点一下直接切页面，不需要"进去再退出来"。
 *  - 我的：列表选择侧栏 + 歌曲列表（表盘专属）
 *  - 搜索 / 歌单 / 排行榜 / 设置：复用原有子页面
 */
import { memo, useEffect, useMemo, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'

import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { useWindowSize } from '@/utils/hooks'
import { useSettingValue } from '@/store/setting/hook'
import { useFontSize } from '@/store/common/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Search from '@/screens/Home/Views/Search'
import SongList from '@/screens/Home/Views/SongList'
import Leaderboard from '@/screens/Home/Views/Leaderboard'
import Setting from '@/screens/Home/Views/Setting'
import WatchSettings from './Settings'
import WatchList from './List'
import { makeMetrics } from './metrics'
import { setSpText } from '@/utils/pixelRatio'
import { exitApp, setFullscreen } from '@/utils/nativeModules/utils'
import WatchBackground from './WatchBackground'

type TabId = 'mine' | 'search' | 'songlist' | 'top' | 'setting'

const WatchHome = memo(({ componentId }: { componentId: string }) => {
  const win = useWindowSize()
  const userCorner = useSettingValue('common.watchCornerRadius')
  const railSide = useSettingValue('common.watchRailSide')
  const showRailExit = useSettingValue('common.watchRailExit')
  const fontSize = useFontSize()
  // fontSize 进依赖：改字体大小时重新算行高/高度，避免文字被裁
  const m = useMemo(() => makeMetrics(win.width, win.height, userCorner), [win.width, win.height, userCorner, fontSize])

  const theme = useTheme()
  const t = useI18n()
  const [tab, setTab] = useState<TabId>('mine')

  const tabs = useMemo<Array<{ id: TabId, icon: string, label: string }>>(() => [
    { id: 'mine', icon: 'love', label: t('nav_love') },
    { id: 'search', icon: 'search-2', label: t('nav_search') },
    { id: 'songlist', icon: 'album', label: t('nav_songlist') },
    { id: 'top', icon: 'leaderboard', label: t('nav_top') },
    { id: 'setting', icon: 'setting', label: t('nav_setting') },
  ], [t])

  // ── 导航栏尺寸 ──
  // 方块边长同时受「栏宽」和「每个槽位的高度」约束：
  //  - 大屏（手机/大表盘）上不会缩成中间一小团挤在一起，而是随槽位放大、上下均匀铺开；
  //  - 小屏上也不会让图标+文字撑出绿色遮罩，或被栏宽裁掉。
  const railCount = tabs.length + (showRailExit ? 1 : 0)
  // 上下各让出圆角安全边距：圆角很大的表盘上，最上/最下的图标会被屏幕圆角切掉
  const railArea = Math.max(win.height - m.sysTop - m.sysBottom - m.cornerSafe * 2, 160)
  const railSlot = railArea / railCount
  const railBoxW = Math.max(Math.min(m.rail - 4, railSlot * 0.82), 30)
  const railIcon = Math.max(Math.min(railBoxW * 0.46, m.iconMd * 0.9), 14)
  const railFont = Math.max(Math.min(railBoxW * 0.2, m.fontSm * 0.92), 8)
  // 高度按内容兜底：文字被用户调大时，遮罩跟着变高，不会"上下露出一截"
  const railBoxH = Math.max(railBoxW, railIcon + setSpText(railFont) * 1.35 + 8)

  // 全面屏：设置变化（以及每次进入主页）都重新申请一次，
  // 这样重启后不用进设置页也能恢复沉浸状态
  const fullscreen = useSettingValue('common.watchFullscreen')
  useEffect(() => {
    setFullscreen(fullscreen)
  }, [fullscreen])

  const content = useMemo(() => {
    // 我的列表：表盘专属界面，直接用
    if (tab === 'mine') return <WatchList componentId={componentId} />
    // 其余直接渲染原有的手机版页面（不做缩放，界面与手机版一致）
    switch (tab) {
      case 'search': return <Search />
      case 'songlist': return <SongList />
      case 'top': return <Leaderboard />
      case 'setting': return <WatchSettings />
      default: return <Setting />
    }
  }, [tab, componentId])

  return (
    <WatchBackground>
    <View style={[styles.container, railSide === 'right' && styles.containerReverse]}>
      {/* 常驻导航栏 */}
      <View style={[styles.rail, {
        width: m.rail,
        paddingTop: m.sysTop + m.cornerSafe,
        paddingBottom: m.sysBottom + m.cornerSafe,
        // 弧形边也往里收一点，图标不会压在屏幕边缘的圆角弧上
        paddingLeft: Math.min(m.cornerSafe * 0.6, 8),
        paddingRight: Math.min(m.cornerSafe * 0.6, 8),
      }]}>
        {
          tabs.map(({ id, icon, label }) => {
            const active = tab === id
            return (
              <TouchableOpacity
                key={id}
                style={[
                  styles.railItem,
                  // 绿色遮罩包住图标和文字（高度按内容兜底）
                  { width: railBoxW, height: railBoxH },
                  active && { backgroundColor: theme['c-primary-background-hover'] },
                ]}
                activeOpacity={0.6}
                onPress={() => { setTab(id) }}
              >
                <Icon name={icon} size={railIcon} color={active ? theme['c-primary'] : theme['c-500']} />
                <Text
                  size={railFont}
                  color={active ? theme['c-primary'] : theme['c-500']}
                  numberOfLines={1}
                  style={{ marginTop: 1, width: railBoxW - 4, textAlign: 'center' }}
                >{label}</Text>
              </TouchableOpacity>
            )
          })
        }
        { showRailExit
          ? (
              // 退出：紧跟在导航项后面；点击完全结束应用（进程一并结束，播放也随之停止）
              <View>
                <TouchableOpacity
                  style={[styles.railItem, { width: railBoxW, height: railBoxH }]}
                  activeOpacity={0.6}
                  onPress={() => { exitApp() }}
                >
                  <Icon name="exit" size={railIcon} color={theme['c-500']} />
                  <Text size={railFont} color={theme['c-500']} numberOfLines={1} style={{ marginTop: 1, width: railBoxW - 4, textAlign: 'center' }}>退出</Text>
                </TouchableOpacity>
              </View>
            )
          : null }
      </View>

      {/* 内容区（左右留白避开圆角） */}
      <View style={[styles.content, {
        // 圆角屏：内容区四角必须避开圆角的弧，否则搜索框第一行、标题会被切掉半截
        paddingTop: m.insetTop + m.cornerSafe * 0.75,
        paddingBottom: m.insetBottom + m.cornerSafe * 0.75,
        paddingLeft: Math.max(m.side * 0.4, m.cornerSafe * 0.6),
        paddingRight: Math.max(m.side * 0.7, m.cornerSafe * 0.6),
      }]}>
        {content}
      </View>
    </View>
    </WatchBackground>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  subPage: {
    flex: 1,
    flexDirection: 'column',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerReverse: {
    flexDirection: 'row-reverse',
  },
  rail: {
    flexShrink: 0,
    // 关键：按可用高度均匀铺开，而不是全挤在中间一小团
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  railItem: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  railSpacer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
})

export default WatchHome
