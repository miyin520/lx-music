// import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import ImageBackground from '@/components/common/ImageBackground'
import { useWindowSize } from '@/utils/hooks'
import { useMemo } from 'react'
import { scaleSizeAbsHR } from '@/utils/pixelRatio'
import { defaultHeaders } from './common/Image'
import SizeView from './SizeView'
import { useBgPic } from '@/store/common/hook'
import { useSettingValue } from '@/store/setting/hook'

interface Props {
  children: React.ReactNode
}

const BLUR_RADIUS = Math.max(scaleSizeAbsHR(18), 10)

export default ({ children }: Props) => {
  const theme = useTheme()
  const windowSize = useWindowSize()
  const pic = useBgPic()
  // 圆角屏（手表）：只做上下留白，避免顶栏/底栏被屏幕圆角切掉。
  // 左右不加内边距——留白会把界面挤出一条空边，列表反而不整齐。
  const watchScreenInset = useSettingValue('common.watchScreenInset')
  const inset = watchScreenInset || 0
  const contentStyle = useMemo(() => inset > 0
    ? { flex: 1, flexDirection: 'column' as const, paddingTop: inset, paddingBottom: inset }
    : { flex: 1, flexDirection: 'column' as const }, [inset])
  // 上下留白后背景要往外扩，否则边上露出空白
  const bgStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: 0,
    top: -inset,
    height: windowSize.height + inset * 2,
    width: windowSize.width,
    backgroundColor: theme['c-content-background'],
  }), [inset, theme, windowSize.height, windowSize.width])
  // const [wh, setWH] = useState<{ width: number | string, height: number | string }>({ width: '100%', height: Dimensions.get('screen').height })

  // 固定宽高度 防止弹窗键盘时大小改变导致背景被缩放
  // useEffect(() => {
  //   const onChange = () => {
  //     setWH({ width: '100%', height: '100%' })
  //   }

  //   const changeEvent = Dimensions.addEventListener('change', onChange)
  //   return () => {
  //     changeEvent.remove()
  //   }
  // }, [])
  // const handleLayout = (e: LayoutChangeEvent) => {
  //   // console.log('handleLayout', e.nativeEvent)
  //   // console.log(Dimensions.get('screen'))
  //   setWH({ width: e.nativeEvent.layout.width, height: Dimensions.get('screen').height })
  // }
  // console.log('render page content')

  const themeComponent = useMemo(() => (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <ImageBackground
        style={bgStyle}
        source={theme['bg-image']}
        resizeMode="cover"
      >
      </ImageBackground>
      <View style={{ ...contentStyle, backgroundColor: theme['c-main-background'] }}>
        {children}
      </View>
    </View>
  ), [children, theme, bgStyle, contentStyle])
  const picComponent = useMemo(() => {
    return (
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <ImageBackground
          style={bgStyle}
          source={{ uri: pic!, headers: defaultHeaders }}
          resizeMode="cover"
          blurRadius={BLUR_RADIUS}
        >
          <View style={{ flex: 1, flexDirection: 'column', backgroundColor: theme['c-content-background'], opacity: 0.76 }}></View>
        </ImageBackground>
        <View style={contentStyle}>
          {children}
        </View>
      </View>
    )
  }, [children, pic, theme, bgStyle, contentStyle])

  return (
    <>
      <SizeView />
      {pic ? picComponent : themeComponent}
    </>
  )
}
