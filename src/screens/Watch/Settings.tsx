/**
 * 手表设置入口
 *
 * 手机版设置是「一长条 + 分组」，在表盘上要滑很久才能找到想要的项。
 * 这里改成方块入口：每块代表一组设置，点进去再看该组的详细项目。
 */
import { memo, useCallback, useMemo, useState } from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'

import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { useWindowSize } from '@/utils/hooks'
import { useSettingValue } from '@/store/setting/hook'
import { useFontSize } from '@/store/common/hook'
import { useI18n } from '@/lang'
import { useBackHandler } from '@/utils/hooks/useBackHandler'
import { makeMetrics } from './metrics'
import type { SettingScreenIds } from '@/screens/Home/Views/Setting'

import Basic from '@/screens/Home/Views/Setting/settings/Basic'
import Player from '@/screens/Home/Views/Setting/settings/Player'
import LyricDesktop from '@/screens/Home/Views/Setting/settings/LyricDesktop'
import Search from '@/screens/Home/Views/Setting/settings/Search'
import List from '@/screens/Home/Views/Setting/settings/List'
import Sync from '@/screens/Home/Views/Setting/settings/Sync'
import Backup from '@/screens/Home/Views/Setting/settings/Backup'
import Other from '@/screens/Home/Views/Setting/settings/Other'
import Version from '@/screens/Home/Views/Setting/settings/Version'
import About from '@/screens/Home/Views/Setting/settings/About'

interface TileMeta {
  id: SettingScreenIds
  label: string
  icon: string
}

/** 方块顺序：常用功能靠前 */
const TILES: TileMeta[] = [
  { id: 'basic', label: '基本设置', icon: 'setting' },
  { id: 'player', label: '播放设置', icon: 'play-outline' },
  { id: 'lyric_desktop', label: '桌面歌词', icon: 'lyric-on' },
  { id: 'search', label: '搜索设置', icon: 'search-2' },
  { id: 'list', label: '列表设置', icon: 'list-order' },
  { id: 'sync', label: '数据同步', icon: 'share' },
  { id: 'backup', label: '备份恢复', icon: 'download-2' },
  { id: 'other', label: '其他设置', icon: 'menu' },
  { id: 'version', label: '软件更新', icon: 'available_updates' },
  { id: 'about', label: '关于', icon: 'help' },
]

const SectionBody = memo(({ id }: { id: SettingScreenIds }) => {
  switch (id) {
    case 'basic': return <Basic />
    case 'player': return <Player />
    case 'lyric_desktop': return <LyricDesktop />
    case 'search': return <Search />
    case 'list': return <List />
    case 'sync': return <Sync />
    case 'backup': return <Backup />
    case 'other': return <Other />
    case 'version': return <Version />
    case 'about': return <About />
    default: return null
  }
})

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const win = useWindowSize()
  const userInset = useSettingValue('common.watchScreenInset')
  const fontSize = useFontSize()
  const m = useMemo(() => makeMetrics(win.width, win.height, userInset), [win.width, win.height, userInset, fontSize])
  const [active, setActive] = useState<SettingScreenIds | null>(null)

  // 进入子分组后，返回键应该先回到方块页
  useBackHandler(useCallback(() => {
    if (!active) return false
    setActive(null)
    return true
  }, [active]))

  // 一行两块。注意不能用窗口宽度：内容区还要扣掉侧边栏，
  // 之前就因为这个算大了，方块被迫换行成了一列。
  const [contentW, setContentW] = useState(0)
  const tileWidth = contentW > 0 ? (contentW - m.side * 0.6) / 2 : 0

  if (active) {
    const meta = TILES.find(x => x.id == active)
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={{ height: m.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: m.side * 0.4 }}
          activeOpacity={0.6}
          onPress={() => { setActive(null) }}
        >
          <Icon name="chevron-left" size={m.iconMd} color={theme['c-primary']} />
          <Text size={m.fontMd} color={theme['c-primary']} style={{ marginLeft: m.side * 0.2 }} numberOfLines={1}>
            {meta?.label ?? t('nav_setting')}
          </Text>
        </TouchableOpacity>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: m.side * 0.4, paddingBottom: m.insetBottom + m.side }}
          keyboardShouldPersistTaps="always"
        >
          <SectionBody id={active} />
        </ScrollView>
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: m.side * 0.5, paddingTop: m.side * 0.3, paddingBottom: m.insetBottom + m.side }}
    >
      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}
        onLayout={e => { setContentW(e.nativeEvent.layout.width) }}
      >
        {TILES.map(item => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => { setActive(item.id) }}
            style={{
              width: tileWidth,
              height: tileWidth * 0.78,
              marginBottom: m.side * 0.6,
              borderRadius: m.side * 0.6,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme['c-content-background'],
              borderWidth: 1,
              borderColor: theme['c-border-background'],
            }}
          >
            <Icon name={item.icon} size={m.iconMd} color={theme['c-primary']} />
            <Text size={m.fontSm} color={theme['c-font']} style={{ marginTop: m.fontSm * 0.5 }} numberOfLines={1}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
})
