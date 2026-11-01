/**
 * 系统栏避让（状态栏 / 手势条）
 *
 * 手表上系统栏高度差异很大：
 * - 原厂系统可能没有状态栏
 * - 第三方 ROM / 类原生系统通常有状态栏，且会画在应用上层
 * 所以不能写死，必须读系统值，并留一点安全余量。
 */
import { Dimensions, StatusBar } from 'react-native'
import { getDisplayCornerRadius } from '@/utils/nativeModules/utils'

export interface SystemInsets {
  top: number
  bottom: number
}

/** 系统状态栏高度（dp）；没有状态栏时为 0 */
export const getStatusBarHeight = (): number => {
  const h = StatusBar.currentHeight
  return Number.isFinite(h) && (h as number) > 0 ? (h as number) : 0
}

/**
 * 底部系统栏（手势条/导航栏）高度估算：
 * screen 与 window 的高度差就是被系统 UI 占掉的部分。
 * 拿不到就按 0 处理。
 */
export const getBottomInset = (): number => {
  try {
    const screen = Dimensions.get('screen')
    const win = Dimensions.get('window')
    const diff = screen.height - win.height
    return Number.isFinite(diff) && diff > 0 && diff < 80 ? diff : 0
  } catch (err) {
    return 0
  }
}

export const getSystemInsets = (): SystemInsets => ({
  top: getStatusBarHeight(),
  bottom: getBottomInset(),
})


/**
 * 屏幕圆角半径（dp），0 表示读不到。
 *
 * 有的表盘四角非常圆（半径能到短边的四分之一），靠边的内容会被圆角切掉。
 * Android 12+ 能从系统读到精确值；读不到返回 0，由 metrics 按短边估算。
 * 只在首次调用时过一次桥，之后走缓存。
 */
let _cornerRadius: number | null = null
export const getCornerRadius = (): number => {
  if (_cornerRadius != null) return _cornerRadius
  _cornerRadius = getDisplayCornerRadius()
  return _cornerRadius
}
