/**
 * 底部迷你播放条
 *
 * 单独拆出来是为了隔离播放进度：进度每秒都会更新，
 * 如果写在列表组件里，会导致整个歌曲列表跟着重渲染（几千首时非常卡）。
 */
import { memo, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'

import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { usePlayerMusicInfo, useIsPlay, useProgress } from '@/store/player/hook'
import { togglePlay, playNext, playPrev } from '@/core/player/player'
import type { WatchMetrics } from './metrics'

interface Props {
  m: WatchMetrics
  onPressDetail: () => void
}

export default memo(({ m, onPressDetail }: Props) => {
  const theme = useTheme()
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const { nowPlayTimeStr, progress } = useProgress(true)

  const handlePrev = useCallback(() => { void playPrev() }, [])
  const handleNext = useCallback(() => { void playNext() }, [])

  return (
    <TouchableOpacity
      style={{
        height: m.player,
        paddingHorizontal: m.side * 0.8,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme['c-border-background'],
      }}
      activeOpacity={0.7}
      onPress={onPressDetail}
    >
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text size={m.fontSm} numberOfLines={1}>{musicInfo?.name || '未在播放'}</Text>
        <View style={{ height: 3, marginTop: m.fontSm * 0.35, borderRadius: 2, backgroundColor: theme['c-border-background'], overflow: 'hidden' }}>
          <View style={{ height: 3, width: `${Math.min(Math.max(progress * 100, 0), 100)}%`, backgroundColor: theme['c-primary'] }} />
        </View>
      </View>
      <Text size={m.fontSm} color={theme['c-500']} style={{ marginLeft: m.side * 0.5 }}>{nowPlayTimeStr}</Text>
      <TouchableOpacity style={{ width: m.playBtn, height: m.playBtn, alignItems: 'center', justifyContent: 'center' }} onPress={handlePrev} activeOpacity={0.5}>
        <Icon name="prevMusic" size={m.playIcon} color={theme['c-button-font']} />
      </TouchableOpacity>
      <TouchableOpacity style={{ width: m.playBtn, height: m.playBtn, alignItems: 'center', justifyContent: 'center' }} onPress={togglePlay} activeOpacity={0.5}>
        <Icon name={isPlay ? 'pause' : 'play'} size={m.playIcon * 1.15} color={theme['c-button-font']} />
      </TouchableOpacity>
      <TouchableOpacity style={{ width: m.playBtn, height: m.playBtn, alignItems: 'center', justifyContent: 'center' }} onPress={handleNext} activeOpacity={0.5}>
        <Icon name="nextMusic" size={m.playIcon} color={theme['c-button-font']} />
      </TouchableOpacity>
    </TouchableOpacity>
  )
})
