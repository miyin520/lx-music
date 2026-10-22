/**
 * 手表专属主界面
 *
 * 尺寸全部由 metrics 按可用窗口推算（不写死像素）：
 * 顶部窄条（列表名 + 菜单）/ 中间歌曲列表 / 底部迷你播放条。
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Animated, FlatList, ScrollView, TouchableOpacity, PanResponder } from 'react-native'

import Text from '@/components/common/Text'
import Input from '@/components/common/Input'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { useMyList, useActiveListId, useMusicList } from '@/store/list/hook'
import { usePlayerMusicInfo, useIsPlay } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { useSettingValue } from '@/store/setting/hook'
import { useFontSize } from '@/store/common/hook'
import { setActiveList, addListMusics, removeListMusics, getListMusics } from '@/core/list'
import { playList, togglePlay, playNext, playPrev } from '@/core/player/player'
import { navigations } from '@/navigation'
import { LIST_IDS } from '@/config/constant'
import { createStyle } from '@/utils/tools'
// 原版「歌曲菜单」（播放/稍后播放/添加到/移动到/换源/分享/详情/清理缓存/不喜欢/移除）
import MusicListMenu, { type ListMenuType } from '@/screens/Home/Views/Mylist/MusicList/ListMenu'
import type { SelectInfo as MusicMenuSelectInfo } from '@/screens/Home/Views/Mylist/MusicList/ListMenu'
import MusicToggleModal, { type MusicToggleModalType } from '@/screens/Home/Views/Mylist/MusicList/MusicToggleModal'
import ListMusicAdd, { type MusicAddModalType as ListMusicAddType } from '@/components/MusicAddModal'
import MusicPositionModal, { type MusicPositionModalType } from '@/screens/Home/Views/Mylist/MusicList/MusicPositionModal'
import {
  clearMusicUrl, handleDislikeMusic, handlePlayLater, handleRemove,
  handleShare, handleShowMusicSourceDetail, handleUpdateMusicPosition,
} from '@/screens/Home/Views/Mylist/MusicList/listAction'

// 原版「列表菜单」（新建/重命名/排序歌曲/重复歌曲/添加本地/更新/导入/导出/移除）
import MyListMenu, { type ListMenuType as MyListMenuType } from '@/screens/Home/Views/Mylist/MyList/ListMenu'
import ListNameEdit, { type ListNameEditType } from '@/screens/Home/Views/Mylist/MyList/ListNameEdit'
import ListMusicSort, { type ListMusicSortType } from '@/screens/Home/Views/Mylist/MyList/ListMusicSort'
import DuplicateMusic, { type DuplicateMusicType } from '@/screens/Home/Views/Mylist/MyList/DuplicateMusic'
import ListImportExport, { type ListImportExportType } from '@/screens/Home/Views/Mylist/MyList/ListImportExport'
import { handleRemove as handleListRemove, handleSync as handleListSync } from '@/screens/Home/Views/Mylist/MyList/listAction'
import { searchListMusic } from '@/screens/Home/Views/Mylist/MusicList/listAction'
import PlayerBar from './PlayerBar'
import { makeMetrics, dumpMetrics, type WatchMetrics } from './metrics'

interface SongRowProps {
  item: LX.Music.MusicInfo
  index: number
  realIndex: number
  active: boolean
  isPlay: boolean
  theme: ReturnType<typeof useTheme>
  m: WatchMetrics
  onPlay: (index: number) => void
  onMenu: (item: LX.Music.MusicInfo, index: number) => void
}

/**
 * 单行歌曲
 * memo 化：父组件因播放进度、主题等变化重渲染时，未变化的行直接跳过。
 */
const SongRow = memo(({ item, index, realIndex, active, isPlay, theme, m, onPlay, onMenu }: SongRowProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.row,
        { height: m.row, paddingHorizontal: m.side * 0.5 },
        active && { backgroundColor: theme['c-primary-background-hover'] },
      ]}
      activeOpacity={0.6}
      onPress={() => { onPlay(realIndex) }}
      onLongPress={() => { onMenu(item, realIndex) }}
      delayLongPress={350}
    >
      <View style={{ width: m.fontMd * 1.6, alignItems: 'center' }}>
        {
          active
            ? <Icon name={isPlay ? 'pause' : 'play-outline'} size={m.fontMd * 0.95} color={theme['c-primary']} />
            : <Text size={m.fontSm} color={theme['c-350']}>{index + 1}</Text>
        }
      </View>
      <View style={styles.rowText}>
        <Text size={m.fontMd} color={active ? theme['c-primary'] : theme['c-font']} numberOfLines={1}>{item.name}</Text>
        <Text size={m.fontSm} color={theme['c-500']} numberOfLines={1}>{item.singer}</Text>
      </View>
    </TouchableOpacity>
  )
})

const WatchList = memo(({ componentId }: { componentId: string }) => {
  const theme = useTheme()
  const win = useWindowSize()
  const userInset = useSettingValue('common.watchScreenInset')
  const fontSize = useFontSize()
  // fontSize 进依赖：改字体大小时重新算行高/高度，避免文字被裁
  const m = useMemo(() => makeMetrics(win.width, win.height, userInset), [win.width, win.height, userInset, fontSize])

  const lists = useMyList()
  const activeListId = useActiveListId()
  const musicList = useMusicList()
  const playerMusicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()

  // 把真实尺寸写出来，方便核对布局（不影响功能）
  useEffect(() => { void dumpMetrics(m) }, [m])

  // 歌曲菜单相关
  const musicMenuRef = useRef<ListMenuType>(null)
  const musicToggleModalRef = useRef<MusicToggleModalType>(null)
  const musicAddRef = useRef<ListMusicAddType>(null)
  const musicPositionRef = useRef<MusicPositionModalType>(null)
  // 列表菜单相关
  const listMenuRef = useRef<MyListMenuType>(null)
  const listNameEditRef = useRef<ListNameEditType>(null)
  const listMusicSortRef = useRef<ListMusicSortType>(null)
  const duplicateMusicRef = useRef<DuplicateMusicType>(null)
  const listImportExportRef = useRef<ListImportExportType>(null)

  const [showListPicker, setShowListPicker] = useState(false)
  // 列表内搜索（与原版一致的匹配规则）
  const [searching, setSearching] = useState(false)
  const [keyword, setKeyword] = useState('')
  const displayList = useMemo(
    () => keyword ? searchListMusic(musicList as LX.Music.MusicInfo[], keyword) : (musicList as LX.Music.MusicInfo[]),
    [musicList, keyword],
  )
  // ── 分页挂载 ──
  // 几千首时一次性全部交给 FlatList，首屏会创建大量行视图并占用较多原生内存，
  // 在手表上容易直接被系统杀掉（闪退）。这里只挂载已加载的部分，滑到底再追加。
  const WINDOW_SIZE = 400
  const [listWin, setListWin] = useState({ start: 0, end: WINDOW_SIZE })
  const totalCount = displayList.length
  // 只把「窗口内」的歌曲交给列表：几千首时内存与渲染压力都能压住，
  // 拖动滚动条跳远时会直接换一个窗口，而不是把中间几千行都加载出来。
  const pageData = useMemo(
    () => displayList.slice(listWin.start, Math.min(listWin.end, displayList.length)),
    [displayList, listWin.start, listWin.end],
  )
  // 滚动条按「全部歌曲」的高度计算，这样即使只挂载了一段，比例也是准的
  const totalHeight = totalCount * m.row
  const pendingIndex = useRef<number | null>(null)
  const jumpToRef = useRef<(index: number) => void>(() => {})

  // ── 可拖动的滚动指示条 ──
  // 收藏几千首时，系统自带指示条在手表上又细又不能拖，只能靠手指猛划。
  // 位置用 Animated.Value 直接写到原生层：滚动时不再每帧 setState，
  // 否则整个列表（含 FlatList）每帧重渲染，滑起来会明显卡顿。
  const listRef = useRef<FlatList<LX.Music.MusicInfo> | null>(null)
  const scrollInfo = useRef({ offset: 0, contentH: 0, viewH: 0 })
  const barTop = useRef(new Animated.Value(0)).current
  const barGeo = useRef({ height: 0, trackH: 0, top: 0 })
  const [barUi, setBarUi] = useState({ height: 0, visible: false })
  const dragStart = useRef(0)
  const lastSyncedTop = useRef(0)

  // 滑块高度直接按「行数」算，不依赖 contentH。
  // 之前用 contentH 计算，首次布局时 contentH 还是 0，会得到 Infinity 的高度，
  // 原生视图拿到非法尺寸后就再也不能拖了（只能重启）—— 用户反馈的正是这个现象。
  const syncBar = useCallback((windowOffset: number, viewH: number) => {
    if (viewH <= 0 || totalCount <= 0) {
      if (barUi.visible) setBarUi({ height: 0, visible: false })
      return
    }
    const visibleRows = Math.max(viewH / m.row, 1)
    const height = Math.max(viewH * Math.min(visibleRows / totalCount, 1), m.barMin)
    const trackH = Math.max(viewH - height, 0)
    // windowOffset 是当前窗口内的偏移，加上窗口起点才是歌曲在总歌单里的位置
    const globalOffset = listWin.start * m.row + windowOffset
    const ratio = Math.min(Math.max(globalOffset / Math.max(totalHeight - viewH, 1), 0), 1)
    barGeo.current = { height, trackH, top: ratio * trackH }
    // 位移小于 1.5dp 不更新：滚动条只是指示用途，减少跨桥调用是主要性能手段
    if (Math.abs(barGeo.current.top - lastSyncedTop.current) > 1.5) {
      lastSyncedTop.current = barGeo.current.top
      barTop.setValue(barGeo.current.top)
    }
    if (Math.abs(barUi.height - height) > 0.5 || !barUi.visible) setBarUi({ height, visible: true })
  }, [barUi.height, barUi.visible, barTop, m.barMin, totalHeight, totalCount, listWin.start, m.row])

  const jumpToIndex = useCallback((index: number) => {
    const target = Math.min(Math.max(index, 0), Math.max(totalCount - 1, 0))
    // 目标在当前窗口内：直接滚过去
    if (target >= listWin.start && target < listWin.end) {
      listRef.current?.scrollToOffset({ offset: (target - listWin.start) * m.row, animated: false })
      return
    }
    // 不在窗口内：换一个以目标为中心的窗口，渲染后再定位
    const start = Math.max(0, target - Math.floor(WINDOW_SIZE / 4))
    pendingIndex.current = target
    setListWin({ start, end: Math.min(totalCount, start + WINDOW_SIZE) })
  }, [listWin.start, listWin.end, totalCount, m.row])

  jumpToRef.current = jumpToIndex

  // 换窗口后执行定位
  useEffect(() => {
    if (pendingIndex.current == null) return
    const target = pendingIndex.current
    pendingIndex.current = null
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: Math.max(target - listWin.start, 0) * m.row, animated: false })
    })
  }, [listWin.start, listWin.end, m.row])

  // 拖动过程中只移动滑块并显示「第 N 首」提示，不滚动列表。
  // 之前每移动一像素就 scrollToOffset 一次，等于每一帧都在重排列表，手表上必然卡。
  const [dragTip, setDragTip] = useState<number | null>(null)
  const lastTipIndex = useRef(-1)
  // 手势对象必须只创建一次：
  // 之前它依赖 jumpToIndex/totalCount，拖动中每次 setDragTip 触发重渲染都会重建
  // PanResponder，正在进行的拖动手势会失效 —— 表现就是「有时候拖不动」。
  const latest = useRef({ totalCount, jumpToIndex })
  latest.current = { totalCount, jumpToIndex }

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      dragStart.current = barGeo.current.top
      lastTipIndex.current = -1
      setDragTip(Math.floor((barGeo.current.top / Math.max(barGeo.current.trackH, 1)) * latest.current.totalCount))
    },
    onPanResponderMove: (_evt, gesture) => {
      const { trackH } = barGeo.current
      if (trackH <= 0) return
      const top = Math.min(Math.max(dragStart.current + gesture.dy, 0), trackH)
      barGeo.current.top = top
      barTop.setValue(top)
      const index = Math.floor((top / trackH) * latest.current.totalCount)
      if (index != lastTipIndex.current) {
        lastTipIndex.current = index
        setDragTip(index)
      }
    },
    onPanResponderRelease: () => {
      const { trackH } = barGeo.current
      setDragTip(null)
      if (trackH > 0 && latest.current.totalCount) {
        jumpToRef.current(Math.floor((barGeo.current.top / trackH) * latest.current.totalCount))
      }
    },
    onPanResponderTerminate: () => { setDragTip(null) },
  })).current

  useEffect(() => { setListWin({ start: 0, end: WINDOW_SIZE }) }, [activeListId, keyword])

  // 搜索结果的索引与原列表不同，播放/菜单要用真实索引
  const indexMap = useMemo(() => {
    const map = new Map<string, number>()
    ;(musicList as LX.Music.MusicInfo[]).forEach((m, i) => map.set(m.id, i))
    return map
  }, [musicList])

  // 菜单锚点：放在屏幕中间偏上，菜单从中间展开（贴边在圆角表上点不到）
  const menuAnchor = useMemo(() => ({
    x: Math.max(m.side, (m.width - 110) / 2),
    y: Math.max(m.insetTop + m.fontMd, (m.height - 300) / 2),
    w: 0,
    h: 0,
  }), [m.width, m.height, m.side, m.insetTop, m.fontMd])

  // 歌曲长按 → 原版歌曲菜单（播放/稍后播放/添加到/移动到/换源/分享/详情/清缓存/不喜欢/移除）
  const openAction = useCallback((item: LX.Music.MusicInfo, index: number) => {
    musicMenuRef.current?.show({
      musicInfo: item,
      index,
      listId: activeListId,
      single: true,
      selectedList: [],
    } as MusicMenuSelectInfo, menuAnchor)
  }, [activeListId, menuAnchor])

  const activeList = useMemo(
    () => lists.find(l => l.id === activeListId) ?? lists[0],
    [lists, activeListId],
  )

  const handlePlay = useCallback((index: number) => {
    void playList(activeListId, index)
  }, [activeListId])

  // 顶部列表选择条：◁ 上一个 / ▷ 下一个
  const switchPrev = useCallback(() => {
    if (lists.length < 2) return
    const idx = lists.findIndex(l => l.id === activeListId)
    const next = (idx - 1 + lists.length) % lists.length
    setActiveList(lists[next].id)
  }, [lists, activeListId])

  const switchNext = useCallback(() => {
    if (lists.length < 2) return
    const idx = lists.findIndex(l => l.id === activeListId)
    const next = (idx + 1) % lists.length
    setActiveList(lists[next].id)
  }, [lists, activeListId])

  const openDetail = useCallback(() => {
    navigations.pushPlayDetailScreen(componentId)
  }, [componentId])

  const playingIndex = useMemo(() => {
    // playerState.musicInfo 初始为 null（首次启动/长时间后台后恢复前）。
    // 之前直接取 .id 会抛 TypeError 导致闪退。
    if (!playerMusicInfo?.id) return -1
    return musicList.findIndex(x => x.id === playerMusicInfo.id)
  }, [musicList, playerMusicInfo])

  // 行组件独立出来并 memo：几千首时扁平列表只渲染可见的十几行，
  // 但父组件（进度、主题、播放状态）变化会触发整表重建，memo 能挡掉这部分开销。
  const renderItem = useCallback(({ item, index }: { item: LX.Music.MusicInfo, index: number }) => {
    return (
      <SongRow
        item={item}
        index={index}
        realIndex={indexMap.get(item.id) ?? index}
        active={!!playerMusicInfo?.id && item.id === playerMusicInfo.id}
        isPlay={isPlay}
        theme={theme}
        m={m}
        onPlay={handlePlay}
        onMenu={openAction}
      />
    )
  }, [indexMap, playerMusicInfo, isPlay, theme, m, handlePlay, openAction])

  return (
    // 注意：本组件渲染在 Watch/Home 的内容区里，
    // Home 的容器已经应用过上下留白，这里再加一次会变成双倍（用户反馈"留白过于夸张"）
    <View style={styles.container}>
      {/* 顶部列表选择条：◁ 列表名 ▷  ⋮ */}
      <View style={[styles.topBar, { height: m.header, paddingHorizontal: m.side * 0.4 }]}>
        <TouchableOpacity
          style={{ width: m.touch * 0.8, height: m.header, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.6}
          onPress={switchPrev}
        >
          <Icon name="chevron-left" size={m.iconMd} color={theme['c-350']} />
        </TouchableOpacity>

        {
          searching
            ? <View style={{ flex: 1, height: m.header, justifyContent: 'center', paddingHorizontal: m.side * 0.3 }}>
                <Input
                  value={keyword}
                  onChangeText={setKeyword}
                  placeholder="搜索歌曲"
                  clearBtn
                  style={{ fontSize: m.fontMd }}
                  autoFocus
                />
              </View>
            : <TouchableOpacity
                style={{ flex: 1, height: m.header, alignItems: 'center', justifyContent: 'center' }}
                activeOpacity={0.6}
                onPress={() => { setShowListPicker(true) }}
              >
                <Text size={m.fontMd} numberOfLines={1} color={theme['c-primary']}>
                  {activeList?.name ?? '列表'}
                </Text>
                <Text size={m.fontSm} color={theme['c-500']}>{`${musicList.length} 首`}</Text>
              </TouchableOpacity>
        }

        <TouchableOpacity
          style={{ width: m.touch * 0.8, height: m.header, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.6}
          onPress={switchNext}
        >
          <Icon name="chevron-right" size={m.iconMd} color={theme['c-350']} />
        </TouchableOpacity>

        {/* 搜索：点开后顶部变成输入框，再点一次关闭 */}
        <TouchableOpacity
          style={{ width: m.header * 0.62, height: m.header, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.6}
          onPress={() => {
            setSearching(v => {
              if (v) setKeyword('')
              return !v
            })
          }}
        >
          <Icon
            name={searching ? 'close' : 'search-2'}
            // 取消图标再缩小一档：close 这个字形笔画较粗，缩小后观感更细
            size={searching ? m.iconSm * 0.85 : m.iconSm}
            color={searching ? theme['c-primary'] : theme['c-350']}
          />
        </TouchableOpacity>

      </View>

      {/* 歌曲列表 */}
      <View
        style={{ flex: 1 }}
        onLayout={e => {
          const { height } = e.nativeEvent.layout
          scrollInfo.current.viewH = height
          syncBar(scrollInfo.current.offset, height)
        }}
      >
        <FlatList
          ref={listRef}
          style={styles.list}
          contentContainerStyle={{ paddingHorizontal: m.side * 0.4 }}
          data={pageData}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          renderItem={renderItem}
          // 行高固定，给出布局信息后几千首时滚动与定位都快得多
          getItemLayout={(_data, index) => ({ length: m.row, offset: m.row * index, index })}
          // 3800 首时初次渲染量必须压住，否则首屏会一次性创建大量视图导致卡死
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          updateCellsBatchingPeriod={60}
          windowSize={3}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.8}
          onEndReached={() => {
            // 快到底时把窗口往后挪一屏，保持内存占用稳定
            if (listWin.end < totalCount) setListWin({ start: listWin.start, end: Math.min(totalCount, listWin.end + Math.floor(WINDOW_SIZE / 2)) })
          }}
          scrollEventThrottle={64}
          onScroll={e => {
            const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
            scrollInfo.current.offset = contentOffset.y
            scrollInfo.current.contentH = contentSize.height
            scrollInfo.current.viewH = layoutMeasurement.height
            syncBar(contentOffset.y, layoutMeasurement.height)
          }}
          ListEmptyComponent={
            <View style={{ paddingTop: m.height * 0.06, alignItems: 'center' }}>
              <Text size={m.fontSm} color={theme['c-500']}>{keyword ? '没有匹配的歌曲' : '空列表'}</Text>
            </View>
          }
        />
        {/* 拖动指示条时的位置提示 */}
        {dragTip == null
          ? null
          : <View
              pointerEvents="none"
              style={{
                position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <View style={{
                paddingHorizontal: m.side * 0.6, paddingVertical: m.fontSm * 0.4,
                borderRadius: m.fontSm, backgroundColor: theme['c-content-background'],
                borderWidth: 1, borderColor: theme['c-border-background'],
              }}>
                <Text size={m.fontMd} color={theme['c-primary']}>{`第 ${Math.min(dragTip + 1, totalCount)} 首`}</Text>
                <Text size={m.fontSm} color={theme['c-500']}>{`共 ${totalCount} 首`}</Text>
              </View>
            </View>
        }

        {/* 滚动指示条：可按住拖动；系统自带的那根已关闭，避免出现两条 */}
        {barUi.visible
          ? <View
              pointerEvents="box-none"
              style={{
                position: 'absolute',
                right: m.side * 0.1,
                top: 0,
                bottom: 0,
                width: m.barTouchW,
                alignItems: 'center',
              }}
            >
              <Animated.View
                {...pan.panHandlers}
                // 滑块本身较窄，扩大命中范围，避免"点了没反应"
                hitSlop={{ left: m.barTouchW / 2, right: m.barTouchW / 2, top: 8, bottom: 8 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  transform: [{ translateY: barTop }],
                  width: m.barW,
                  height: barUi.height,
                  borderRadius: m.barW / 2,
                  backgroundColor: theme['c-350'],
                  opacity: 0.9,
                }}
              />
            </View>
          : null}
      </View>

      {/* 列表选择层：全屏、不加深色遮罩；每行右侧 ⋮ 打开该列表的菜单 */}
      {
        showListPicker
          ? <View style={[styles.pickerFull, { backgroundColor: theme['c-content-background'], paddingTop: m.insetTop, paddingBottom: m.insetBottom }]}>
              <View style={[styles.pickerHeader, { height: m.header, paddingHorizontal: m.side * 0.6 }]}>
                <Text size={m.fontMd} color={theme['c-350']}>选择列表</Text>
                <TouchableOpacity
                  style={{ width: m.touch, height: m.header, alignItems: 'center', justifyContent: 'center' }}
                  activeOpacity={0.6}
                  onPress={() => { setShowListPicker(false) }}
                >
                  <Icon name="close" size={m.iconMd} color={theme['c-350']} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: m.side * 0.4 }}>
                {
                  lists.map((item, listIndex) => {
                    const active = item.id === activeListId
                    return (
                      <View key={item.id} style={styles.pickerRow}>
                        <TouchableOpacity
                          style={styles.pickerRowMain}
                          activeOpacity={0.6}
                          onPress={() => { setActiveList(item.id); setShowListPicker(false) }}
                        >
                          <View style={{ width: m.fontMd, alignItems: 'center' }}>
                            { active ? <Icon name="chevron-right" size={m.iconMd} color={theme['c-primary']} /> : null }
                          </View>
                          <Text
                            size={m.fontMd}
                            numberOfLines={1}
                            color={active ? theme['c-primary'] : theme['c-font']}
                            style={{ flex: 1, paddingLeft: m.side * 0.2 }}
                          >{item.name}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ width: m.touch, height: m.touch, alignItems: 'center', justifyContent: 'center' }}
                          activeOpacity={0.6}
                          onPress={() => { listMenuRef.current?.show({ listInfo: item, index: listIndex }, menuAnchor) }}
                        >
                          <Icon name="dots-vertical" size={m.iconMd} color={theme['c-350']} />
                        </TouchableOpacity>
                      </View>
                    )
                  })
                }
              </ScrollView>
            </View>
          : null
      }

      {/* 原版歌曲菜单及其依赖 */}
      <MusicListMenu
        ref={musicMenuRef}
        onPlay={(info) => { void playList(info.listId, info.index) }}
        onPlayLater={(info) => { handlePlayLater(info.listId, info.musicInfo, info.selectedList, () => {}) }}
        onRemove={(info) => { handleRemove(info.listId, info.musicInfo, info.selectedList, () => {}) }}
        onDislikeMusic={(info) => { void handleDislikeMusic(info.musicInfo) }}
        onCopyName={(info) => { handleShare(info.musicInfo) }}
        onMusicSourceDetail={(info) => { void handleShowMusicSourceDetail(info.musicInfo) }}
        onAdd={(info) => { musicAddRef.current?.show({ musicInfo: info.musicInfo, listId: info.listId, isMove: false }) }}
        onMove={(info) => { musicAddRef.current?.show({ musicInfo: info.musicInfo, listId: info.listId, isMove: true }) }}
        onEditMetadata={() => {}}
        onChangePosition={(info) => { musicPositionRef.current?.show(info) }}
        onToggleSource={(info) => { musicToggleModalRef.current?.show(info) }}
        onRemoveCache={(info) => { void clearMusicUrl(info.musicInfo) }}
      />
      <MusicPositionModal ref={musicPositionRef}
        onUpdatePosition={(info, position) => {
          handleUpdateMusicPosition(position, info.listId, info.musicInfo, info.selectedList, () => {})
        }} />
      <MusicToggleModal ref={musicToggleModalRef} />
      <ListMusicAdd ref={musicAddRef} />

      {/* 原版列表菜单及其依赖 */}
      <MyListMenu
        ref={listMenuRef}
        onNew={(index) => { listNameEditRef.current?.showCreate(index) }}
        onRename={(info) => { listNameEditRef.current?.show(info) }}
        onSort={(info) => { listMusicSortRef.current?.show(info) }}
        onDuplicateMusic={(info) => { duplicateMusicRef.current?.show(info) }}
        onImport={(info, position) => { listImportExportRef.current?.import(info, position) }}
        onExport={(info, position) => { listImportExportRef.current?.export(info, position) }}
        onRemove={(info) => { handleListRemove(info) }}
        onSync={(info) => { handleListSync(info) }}
        onSelectLocalFile={(info, position) => { listImportExportRef.current?.selectFile(info, position) }}
      />
      <ListNameEdit ref={listNameEditRef} />
      <ListMusicSort ref={listMusicSortRef} />
      <DuplicateMusic ref={duplicateMusicRef} />
      <ListImportExport ref={listImportExportRef} />

      {/* 迷你播放条：独立组件，避免播放进度每秒刷新整个列表 */}
      <PlayerBar m={m} onPressDetail={openDetail} />
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerFull: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 200,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  flexShrink: {
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
  },
  rowText: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 2,
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  playerBar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.3)',
    overflow: 'hidden',
  },
  playerBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  menuMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  menuPanel: {
    borderRadius: 12,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})

export default WatchList
