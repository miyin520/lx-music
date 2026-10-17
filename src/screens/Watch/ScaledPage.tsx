/**
 * 把「手机版布局」的页面整体等比缩放到可用区域里。
 *
 * 背景：设置/搜索/歌单/排行榜这些页面是按手机设计稿（375×667dp）排的，
 * 表盘窗口小得多。字体调大后内容会溢出到屏幕外，而且没法滚动到。
 * 这里给它们一个固定的逻辑视口，再用 transform 缩放到刚好放得下，
 * 保证任何字号/留白组合下内容都完整可见、内部仍可正常滚动。
 */
import { memo } from 'react'
import { View } from 'react-native'

/** 手机版设计稿尺寸（逻辑像素） */
const LOGICAL_W = 375
const LOGICAL_H = 667

const ScaledPage = memo(({ width, height, children }: {
  width: number
  height: number
  children: React.ReactNode
}) => {
  const availW = Math.max(width, 60)
  const availH = Math.max(height, 60)
  // 取宽高两个方向里更受限的那个，保证整体放得下
  const scale = Math.min(availW / LOGICAL_W, availH / LOGICAL_H, 1)
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <View
        style={{
          width: LOGICAL_W,
          height: LOGICAL_H,
          transform: [{ scale }],
          // 缩放后仍以逻辑尺寸参与布局，这里用绝对定位避免父容器被撑开
          position: 'absolute',
        }}
      >
        {children}
      </View>
    </View>
  )
})

export const getScaledPageSize = (width: number, height: number) => {
  const scale = Math.min(Math.max(width, 60) / LOGICAL_W, Math.max(height, 60) / LOGICAL_H, 1)
  return { width: LOGICAL_W * scale, height: LOGICAL_H * scale, scale }
}

export default ScaledPage
