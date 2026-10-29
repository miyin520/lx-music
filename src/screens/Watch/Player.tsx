/**
 * 手表专属播放页
 *
 * 尺寸全部由 metrics 按可用窗口推算（不写死像素）：
 * 顶栏（返回/歌名/收藏）/ 中间歌词 / 底部进度 + 三键。
 */
import { memo, useCallback, useMemo, useRef, useEffect, useState } from 'react'
import { View, FlatList, TouchableOpacity, PanResponder } from 'react-native'
import PagerView from 'react-native-pager-view'

import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { usePlayerMusicInfo, useIsPlay, useProgress } from '@/store/player/hook'
import { useRef as useReactRef } from 'react'
import { playNext, playPrev, togglePlay } from '@/core/player/player'

import { pop } from '@/navigation'

import { useWindowSize } from '@/utils/hooks'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { useFontSize } from '@/store/common/hook'
import { createStyle } from '@/utils/tools'
import LyricView from '@/screens/PlayDetail/Vertical/Lyric'
import { makeMetrics } from './metrics'
import WatchBackground from './WatchBackground'
import MusicAddModal, { type MusicAddModalType } from '@/components/MusicAddModal'
import DesktopLyricEnable, { type DesktopLyricEnableType } from '@/components/DesktopLyricEnable'
import { MUSIC_TOGGLE_MODE_LIST, MUSIC_TOGGLE_MODE } from '@/config/constant'
import { navigations } from '@/navigation'
import { toast } from '@/utils/tools'
import { getDuration } from '@/plugins/player'
import { updateSetting } from '@/core/common'
import listState from '@/store/list/state'
import SettingPopup, { type SettingPopupType } from '@/screens/PlayDetail/components/SettingPopup'
import TimeoutExitEditModal, { type TimeoutExitEditModalType, useTimeInfo } from '@/components/TimeoutExitEditModal'
import Image from '@/components/common/Image'

/**
 * 可拖动的进度条
 * 表盘上原来的进度条只是个静态 View，完全无法调进度。
 * 这里用 PanResponder 实现「点一下跳到对应位置 + 按住拖动连续调整」。
 */
const SeekBar = ({ progress, onSeek, height, dotSize, barColor, trackColor }: {
  progress: number
  onSeek: (fraction: number) => void
  height: number
  dotSize: number
  barColor: string
  trackColor: string
}) => {
  /**
   * 手表上踩过的坑：
   *  - 松手时 locationX 常为 0 → 进度被打回开头
   *  - measureInWindow 在虚拟屏/表盘上可能不回调 → 宽度一直是 0，怎么拖都算成 0
   * 现在只用两个可靠的量：onLayout 给的宽度、按下时的 locationX，
   * 移动过程中用 pageX 的**相对位移**累加，不再依赖任何异步测量。
   */
  const info = useReactRef({ width: 0, startX: 0, startPageX: 0, fraction: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  const [holdProgress, setHoldProgress] = useState<number | null>(null)
  const holdTimer = useReactRef<ReturnType<typeof setTimeout> | null>(null)

  const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

  const onGrant = (e: any) => {
    const w = info.current.width
    if (w <= 0) return
    const p = clamp01(e.nativeEvent.locationX / w)
    info.current.startX = e.nativeEvent.locationX
    info.current.startPageX = e.nativeEvent.pageX
    info.current.fraction = p
    setHoldProgress(null)
    setDragging(true)
    setDragProgress(p)
  }

  const onMove = (e: any) => {
    const w = info.current.width
    if (w <= 0 || !dragging) return
    const delta = e.nativeEvent.pageX - info.current.startPageX
    const p = clamp01((info.current.startX + delta) / w)
    info.current.fraction = p
    setDragProgress(p)
  }

  const onEnd = () => {
    if (!dragging) return
    const p = info.current.fraction
    setDragging(false)
    setHoldProgress(p)
    if (holdTimer.current) clearTimeout(holdTimer.current)
    holdTimer.current = setTimeout(() => { setHoldProgress(null) }, 1200)
    onSeek(p)
  }

  const shown = dragging ? dragProgress : (holdProgress ?? progress)

  return (
    <View
      style={{ height: Math.max(height * 4, 30), justifyContent: 'center' }}
      onLayout={(e) => { info.current.width = e.nativeEvent.layout.width }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={onGrant}
      onResponderMove={onMove}
      onResponderRelease={onEnd}
      onResponderTerminate={onEnd}
    >
      <View style={{ height, borderRadius: height, backgroundColor: trackColor, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${clamp01(shown) * 100}%`, backgroundColor: barColor }} />
      </View>
      { dragging || holdProgress != null ? (
        <View style={{
          position: 'absolute',
          left: `${clamp01(shown) * 100}%`,
          marginLeft: -dotSize / 2,
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: barColor,
        }} />
      ) : null }
    </View>
  )
}

const WatchPlayer = memo(({ componentId }: { componentId: string }) => {
  const theme = useTheme()
  const win = useWindowSize()
  const userInset = useSettingValue('common.watchScreenInset')
  const fontSize = useFontSize()
  // fontSize 进依赖：改字体大小时重新算行高/高度，避免文字被裁
  const m = useMemo(() => makeMetrics(win.width, win.height, userInset), [win.width, win.height, userInset, fontSize])

  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const { nowPlayTimeStr, maxPlayTimeStr, progress, maxPlayTime, nowPlayTime } = useProgress(true)
  // 跳转：优先用状态里的时长；状态里没有（例如刚切歌还没拿到）就向播放器要一次
  const handleSeek = useCallback(async(fraction: number) => {
    let total = maxPlayTime
    if (!(total > 0)) {
      try {
        total = await getDuration()
      } catch {}
    }
    if (!(total > 0)) {
      toast('当前无法调整进度（时长未知）')
      return
    }
    global.app_event.setProgress(fraction * total)
  }, [maxPlayTime])


  // 0 = 封面，1 = 歌词
  const [page, setPage] = useState(1)
  const addModalRef = useRef<MusicAddModalType>(null)
  const desktopLyricRef = useRef<DesktopLyricEnableType>(null)
  const t = useI18n()

  // 桌面歌词开关
  const enabledDesktopLyric = useSettingValue('desktopLyric.enable')
  const toggleDesktopLyric = useCallback(() => {
    desktopLyricRef.current?.setEnabled(!enabledDesktopLyric)
  }, [enabledDesktopLyric])

  // 播放模式：点一下切到下一个
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')
  const playModeIcon = useMemo(() => {
    switch (togglePlayMethod) {
      case MUSIC_TOGGLE_MODE.listLoop: return 'list-loop'
      case MUSIC_TOGGLE_MODE.random: return 'list-random'
      case MUSIC_TOGGLE_MODE.list: return 'list-order'
      case MUSIC_TOGGLE_MODE.singleLoop: return 'single-loop'
      default: return 'single'
    }
  }, [togglePlayMethod])
  const toggleNextPlayMode = useCallback(() => {
    let index = MUSIC_TOGGLE_MODE_LIST.indexOf(togglePlayMethod as never)
    if (++index >= MUSIC_TOGGLE_MODE_LIST.length) index = 0
    const mode = MUSIC_TOGGLE_MODE_LIST[index]
    updateSetting({ 'player.togglePlayMethod': mode })
    const key = mode === MUSIC_TOGGLE_MODE.listLoop
      ? 'play_list_loop'
      : mode === MUSIC_TOGGLE_MODE.random
        ? 'play_list_random'
        : mode === MUSIC_TOGGLE_MODE.list
          ? 'play_list_order'
          : mode === MUSIC_TOGGLE_MODE.singleLoop ? 'play_single_loop' : 'play_single'
    toast(t(key))
  }, [togglePlayMethod, t])

  // 评论页
  const openComment = useCallback(() => {
    navigations.pushCommentScreen(componentId)
  }, [componentId])
  const pagerRef = useRef<PagerView>(null)
  const settingRef = useRef<SettingPopupType>(null)
  const timeoutRef = useRef<TimeoutExitEditModalType>(null)
  const timeInfo = useTimeInfo()

  const handleBack = useCallback(() => { void pop(componentId) }, [componentId])

  return (
    <WatchBackground>
    <View style={[
      styles.container,
      { paddingTop: m.insetTop, paddingBottom: m.insetBottom },
    ]}>
      {/* 顶栏 */}
      <View style={[styles.header, { height: m.header, paddingHorizontal: m.side }]}>
        <TouchableOpacity
          style={{ width: m.touch, height: m.touch, alignItems: 'center', justifyContent: 'center' }}
          onPress={handleBack}
          activeOpacity={0.6}
        >
          <Icon name="chevron-left" size={m.iconMd} color={theme['c-350']} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text size={m.fontMd} numberOfLines={1}>{musicInfo?.name || '未在播放'}</Text>
          <Text size={m.fontSm} color={theme['c-500']} numberOfLines={1}>{musicInfo?.singer ?? ''}</Text>
        </View>
        {/* 爱心：加入播放列表 */}
        <TouchableOpacity
          style={{ width: m.touch, height: m.touch, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.6}
          onPress={() => {
            const target = 'progress' in (musicInfo as any)
              ? (musicInfo as any).metadata.musicInfo
              : musicInfo
            addModalRef.current?.show({
              musicInfo: target as unknown as LX.Music.MusicInfo,
              listId: listState.activeListId,
              isMove: false,
            })
          }}
        >
          {/* 用原版现成的「添加到列表」图标（add-music），不再自己拼 "+" */}
          <Icon name="add-music" size={m.iconMd} color={theme['c-350']} />
        </TouchableOpacity>
        {/* 定时停止播放（对应手机版图二） */}
        <TouchableOpacity
          style={{ width: m.touch, height: m.touch, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.6}
          onPress={() => { timeoutRef.current?.show() }}
        >
          <Icon name="music_time" size={m.iconMd} color={timeInfo.active ? theme['c-primary'] : theme['c-350']} />
        </TouchableOpacity>
        {/* 播放器设置（对应手机版图三） */}
        <TouchableOpacity
          style={{ width: m.touch, height: m.touch, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.6}
          onPress={() => { settingRef.current?.show() }}
        >
          <Icon name="slider" size={m.iconMd} color={theme['c-350']} />
        </TouchableOpacity>
      </View>

      {/* 封面 / 歌词：可左右滑动切换（原版就是这个交互） */}
      <PagerView
        ref={pagerRef}
        style={styles.lyric}
        initialPage={1}
        onPageSelected={(e) => { setPage(e.nativeEvent.position) }}
      >
        {/* 第 1 页：封面（内容整体缩小，避免上下被圆角/页脚遮挡） */}
        <View key="pic" style={[styles.picPage, { paddingHorizontal: m.side }]}>
          <Image
            url={musicInfo?.pic}
            style={{
              width: m.cover,
              height: m.cover,
              borderRadius: m.cover * 0.1,
            }}
          />
          <Text size={m.fontSm} numberOfLines={1} style={{ marginTop: m.fontSm * 0.6 }}>{musicInfo?.name || '未在播放'}</Text>
          <Text size={m.fontSm} numberOfLines={1} color={theme['c-500']} style={{ marginTop: m.fontSm * 0.15 }}>{musicInfo?.singer ?? ''}</Text>
        </View>

        {/* 第 2 页：歌词 —— 直接用原版实现，
            这样「歌词字体大小 / 对齐方式 / 拖拽调进度」等播放器设置才会生效 */}
        <View key="lyric" style={styles.lyricPage}>
          <LyricView />
        </View>
      </PagerView>

      <SettingPopup ref={settingRef} direction="vertical" />
      <TimeoutExitEditModal ref={timeoutRef} timeInfo={timeInfo} />

      {/* 原版「添加歌曲到列表」弹窗 */}
      <MusicAddModal ref={addModalRef} />

      <DesktopLyricEnable ref={desktopLyricRef} />

      {/* 底部控制 */}
      <View style={[styles.footer, { paddingHorizontal: m.side, paddingBottom: m.side * 0.15 }]}>
        <View style={[styles.progressRow, { marginBottom: m.fontSm * 0.4 }]}>
          <Text size={m.fontSm} color={theme['c-500']}>{nowPlayTimeStr}</Text>
          <View style={{ flex: 1, marginHorizontal: m.side * 0.4 }}>
            <SeekBar
              progress={progress}
              height={Math.max(m.fontSm * 0.45, 6)}
              dotSize={Math.max(m.fontSm * 1.1, 14)}
              barColor={theme['c-primary']}
              trackColor={'rgba(128,128,128,0.3)'}
              onSeek={(fraction) => { void handleSeek(fraction) }}
            />
          </View>
          <Text size={m.fontSm} color={theme['c-500']}>{maxPlayTimeStr}</Text>
        </View>
        <View style={styles.buttons}>
          <TouchableOpacity style={{ width: m.touch, height: m.touch, alignItems: 'center', justifyContent: 'center' }} onPress={() => { void playPrev() }} activeOpacity={0.5}>
            <Icon name="prevMusic" size={m.iconLg} color={theme['c-button-font']} />
          </TouchableOpacity>
          <TouchableOpacity style={{ width: m.btnLg, height: m.btnLg, alignItems: 'center', justifyContent: 'center' }} onPress={togglePlay} activeOpacity={0.5}>
            <Icon name={isPlay ? 'pause' : 'play'} size={m.iconLg * 1.25} color={theme['c-button-font']} />
          </TouchableOpacity>
          <TouchableOpacity style={{ width: m.touch, height: m.touch, alignItems: 'center', justifyContent: 'center' }} onPress={() => { void playNext() }} activeOpacity={0.5}>
            <Icon name="nextMusic" size={m.iconLg} color={theme['c-button-font']} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 功能键一行：桌面歌词 / 播放模式 / 评论 —— 放最底部，避免和播放条冲突 */}
      <View style={[styles.funcRow, { paddingHorizontal: m.side, paddingBottom: m.side * 0.15 }]}>
        <TouchableOpacity style={{ width: m.touch, height: m.touch * 0.9, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.6} onPress={toggleDesktopLyric}>
          <Icon name={enabledDesktopLyric ? 'lyric-on' : 'lyric-off'} size={m.iconMd} color={enabledDesktopLyric ? theme['c-primary'] : theme['c-350']} />
        </TouchableOpacity>
        <TouchableOpacity style={{ width: m.touch, height: m.touch * 0.9, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.6} onPress={toggleNextPlayMode}>
          <Icon name={playModeIcon} size={m.iconMd} color={theme['c-350']} />
        </TouchableOpacity>
        <TouchableOpacity style={{ width: m.touch, height: m.touch * 0.9, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.6} onPress={openComment}>
          <Icon name="comment" size={m.iconMd} color={theme['c-350']} />
        </TouchableOpacity>
      </View>
    </View>
    </WatchBackground>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  lyric: {
    flex: 1,
  },
  lyricPage: {
    flex: 1,
  },
  picPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineText: {
    textAlign: 'center',
    marginBottom: 2,
  },
  footer: {
    justifyContent: 'flex-end',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  seekHint: {
    position: 'absolute',
    alignSelf: 'center',
    top: '46%',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  funcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
})

export default WatchPlayer
