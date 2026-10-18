/**
 * 手表界面的主题背景
 *
 * 表盘界面不经过 PageContent，之前只用了主题的**颜色**，没有渲染主题的**背景图**，
 * 所以在设置里换主题时背景不变（只有歌词页这种走原版组件的页面会变）。
 * 这里补上和 PageContent 一致的背景层：主题背景图 + 主背景色。
 */
import { memo, useMemo } from 'react'
import { View } from 'react-native'

import ImageBackground from '@/components/common/ImageBackground'
import { useTheme } from '@/store/theme/hook'
import { useWindowSize } from '@/utils/hooks'

const WatchBackground = memo(({ children }: { children: React.ReactNode }) => {
  const theme = useTheme()
  const { width, height } = useWindowSize()

  const bgStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: 0,
    top: 0,
    width,
    height,
    backgroundColor: theme['c-content-background'],
  }), [theme, width, height])

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <ImageBackground
        style={bgStyle}
        source={theme['bg-image']}
        resizeMode="cover"
      />
      <View style={{ flex: 1, backgroundColor: theme['c-main-background'] }}>
        {children}
      </View>
    </View>
  )
})

export default WatchBackground
