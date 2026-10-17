import { useEffect, useState } from 'react'
import { Dimensions } from 'react-native'
import { type SizeHandler, windowSizeTools } from '@/utils/windowSizeTools'

/**
 * 取当前窗口尺寸（dp）
 *
 * 注意初始值：windowSizeTools 的尺寸是**异步**填进去的，
 * 首次渲染时它还是 0×0。若直接拿它当初始值，
 * 组件第一帧会按 0 尺寸布局（表现为「首次进入界面全乱/看不到」）。
 * 所以初始值兜底读 Dimensions。
 */
const getInitialSize = () => {
  const cached = windowSizeTools.getSize()
  if (cached.width > 0 && cached.height > 0) return cached
  const win = Dimensions.get('window')
  return { width: win.width, height: win.height }
}

export default () => {
  const [size, setSize] = useState(getInitialSize)

  useEffect(() => {
    const onChange: SizeHandler = (size) => {
      if (!size.width || !size.height) return
      setSize(size)
    }

    const remove = windowSizeTools.onSizeChanged(onChange)
    return () => {
      remove()
    }
  }, [])

  return size
}
