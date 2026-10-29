/**
 * 手表首页：左侧常驻导航栏 + 右侧内容区
 *
 * 关键设计：导航栏**一直显示**，点一下直接切页面，不需要"进去再退出来"。
 *  - 我的：列表选择侧栏 + 歌曲列表（表盘专属）
 *  - 搜索 / 歌单 / 排行榜 / 设置：复用原有子页面
 */
import { memo, useMemo, useState } from 'react'
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
import { exitApp } from '@/utils/nativeModules/utils'
import WatchBackground from './WatchBackground'

type TabId = 'mine' | 'search' | 'songlist' | 'top' | 'setting'

const WatchHome = memo(({ componentId }: { componentId: string }) => {
  const win = useWindowSize()
  const userInset = useSettingValue('common.watchScreenInset')
  const railSide = useSettingValue('common.watchRailSide')
  const showRailExit = useSettingValue('common.watchRailExit')
  const fontSize = useFontSize()
  // fontSize 进依赖：改字体大小时重新算行高/高度，避免文字被裁
  const m = useMemo(() => makeMetrics(win.width, win.height, userInset), [win.width, win.height, userInset, fontSize])

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
        paddingTop: m.sysTop,
        paddingBottom: m.sysBottom,
      }]}>
        {
          tabs.map(({ id, icon, label }) => {
            const active = tab === id
            return (
              <TouchableOpacity
                key={id}
                style={[
                  styles.railItem,
                  // 绿色遮罩做成正方形：宽 = 高 = 导航栏内宽
                  { width: m.rail - 8, height: m.rail - 8 },
                  active && { backgroundColor: theme['c-primary-background-hover'] },
                ]}
                activeOpacity={0.6}
                onPress={() => { setTab(id) }}
              >
                <Icon name={icon} size={m.iconMd} color={active ? theme['c-primary'] : theme['c-500']} />
                <Text
                  size={m.fontSm}
                  color={active ? theme['c-primary'] : theme['c-500']}
                  numberOfLines={1}
                  style={{ marginTop: 2 }}
                >{label}</Text>
              </TouchableOpacity>
            )
          })
        }
        { showRailExit
          ? (
              // 退出：完全结束应用（进程一并结束，播放也随之停止）
              <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: m.sysBottom }}>
                <TouchableOpacity
                  style={[styles.railItem, { width: m.rail - 8, height: m.rail - 8 }]}
                  activeOpacity={0.6}
                  onPress={() => { exitApp() }}
                >
                  <Icon name="exit" size={m.iconMd} color={theme['c-500']} />
                  <Text size={m.fontSm} color={theme['c-500']} numberOfLines={1} style={{ marginTop: 2 }}>退出</Text>
                </TouchableOpacity>
              </View>
            )
          : null }
      </View>

      {/* 内容区（左右留白避开圆角） */}
      <View style={[styles.content, {
        paddingTop: m.insetTop,
        paddingBottom: m.insetBottom,
        paddingLeft: m.side * 0.4,
        paddingRight: m.side * 0.7,
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
    justifyContent: 'center',
  },
  railItem: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 6,
  },
  railSpacer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
})

export default WatchHome
