/**
 * 手表专属主界面
 *
 * 尺寸全部由 metrics 按可用窗口推算（不写死像素）：
 * 顶部窄条（列表名 + 菜单）/ 中间歌曲列表 / 底部迷你播放条。
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, FlatList, ScrollView, TouchableOpacity } from 'react-native'

import Text from '@/components/common/Text'
import Input from '@/components/common/Input'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { useMyList, useActiveListId, useMusicList } from '@/store/list/hook'
import { usePlayerMusicInfo, useIsPlay, useProgress } from '@/store/player/hook'
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
import { makeMetrics, dumpMetrics } from './metrics'

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
  const { nowPlayTimeStr, progress } = useProgress(true)

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
    if (!playerMusicInfo.id) return -1
    return musicList.findIndex(x => x.id === playerMusicInfo.id)
  }, [musicList, playerMusicInfo])

  const renderRow = useCallback(({ item, index }: { item: LX.Music.MusicInfo, index: number }) => {
    const realIndex = indexMap.get(item.id) ?? index
    const active = item.id === playerMusicInfo.id
    return (
      <TouchableOpacity
        style={[
          styles.row,
          { height: m.row, paddingHorizontal: m.side * 0.5 },
          active && { backgroundColor: theme['c-primary-background-hover'] },
        ]}
        activeOpacity={0.6}
        onPress={() => { handlePlay(realIndex) }}
        onLongPress={() => { openAction(item, realIndex) }}
        delayLongPress={350}
      >
        <View style={{ width: m.fontMd * 1.6, alignItems: 'center' }}>
          {
            active
              ? <Icon name={isPlay ? 'pause' : 'play-outline'} size={m.iconSm} color={theme['c-primary']} />
              : <Text size={m.fontSm} color={theme['c-350']}>{index + 1}</Text>
          }
        </View>
        <View style={styles.rowText}>
          <Text size={m.fontMd} color={active ? theme['c-primary'] : theme['c-font']} numberOfLines={1}>{item.name}</Text>
          <Text size={m.fontSm} color={theme['c-500']} numberOfLines={1}>{item.singer}</Text>
        </View>
      </TouchableOpacity>
    )
  }, [playingIndex, isPlay, theme, handlePlay, m])

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
      <FlatList
        style={styles.list}
        contentContainerStyle={{ paddingHorizontal: m.side * 0.4 }}
        data={displayList}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        renderItem={renderRow}
        initialNumToRender={10}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={{ paddingTop: m.height * 0.06, alignItems: 'center' }}>
            <Text size={m.fontSm} color={theme['c-500']}>空列表</Text>
          </View>
        }
      />

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

      {/* 迷你播放条 */}
      <TouchableOpacity
        style={[styles.player, { height: m.player, paddingHorizontal: m.side * 0.8 }]}
        activeOpacity={0.7}
        onPress={openDetail}
      >
        <View style={styles.playerInfo}>
          <Text size={m.fontSm} numberOfLines={1}>{playerMusicInfo.name || '未在播放'}</Text>
          <View style={[styles.playerBar, { marginTop: m.fontSm * 0.35 }]}>
            <View style={[styles.playerBarFill, { width: `${Math.min(Math.max(progress * 100, 0), 100)}%`, backgroundColor: theme['c-primary'] }]} />
          </View>
        </View>
        <Text size={m.fontSm} color={theme['c-500']} style={{ marginLeft: m.side * 0.5 }}>{nowPlayTimeStr}</Text>
        <TouchableOpacity style={{ width: m.playBtn, height: m.playBtn, alignItems: 'center', justifyContent: 'center' }} onPress={() => { void playPrev() }} activeOpacity={0.5}>
          <Icon name="prevMusic" size={m.playIcon} color={theme['c-button-font']} />
        </TouchableOpacity>
        <TouchableOpacity style={{ width: m.playBtn, height: m.playBtn, alignItems: 'center', justifyContent: 'center' }} onPress={togglePlay} activeOpacity={0.5}>
          <Icon name={isPlay ? 'pause' : 'play'} size={m.playIcon * 1.15} color={theme['c-button-font']} />
        </TouchableOpacity>
        <TouchableOpacity style={{ width: m.playBtn, height: m.playBtn, alignItems: 'center', justifyContent: 'center' }} onPress={() => { void playNext() }} activeOpacity={0.5}>
          <Icon name="nextMusic" size={m.playIcon} color={theme['c-button-font']} />
        </TouchableOpacity>
      </TouchableOpacity>
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
