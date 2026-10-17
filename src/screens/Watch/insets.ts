/**
 * 系统栏避让（状态栏 / 手势条）
 *
 * 手表上系统栏高度差异很大：
 * - 原厂系统可能没有状态栏
 * - 第三方 ROM / 类原生系统通常有状态栏，且会画在应用上层
 * 所以不能写死，必须读系统值，并留一点安全余量。
 */
import { Dimensions, StatusBar } from 'react-native'

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
