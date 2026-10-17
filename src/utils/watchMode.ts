/**
 * 小屏（手表）适配探测
 *
 * 关键点：不能只看 windowSizeTools.getSize()。
 * 这个值在模块导入期可能还是 0（SizeView 还没 onLayout），
 * 那样 isWatch() 会一直是 false，表盘专属界面就永远不会生效。
 * 所以加一层兜底：拿不到时直接读 Dimensions。
 */
import { Dimensions } from 'react-native'
import { windowSizeTools } from './windowSizeTools'
import settingState from '@/store/setting/state'

let _isWatch: boolean | null = null
let _uiScale = 1

/**
 * 依据屏幕 dp 尺寸判断是否为手表类小屏
 * 判据：短边 < 460 且 对角线 < 660（不误伤普通手机/平板）
 */
export const detectWatch = (width: number, height: number): boolean => {
  if (!width || !height) return false
  const short = Math.min(width, height)
  const long = Math.max(width, height)
  const diag = Math.sqrt(width * width + height * height)
  // 手表形态很多：410x502、466x466、480x480、396x396……
  // 之前卡「短边 < 460」，会把 480x480 这类方形表直接漏掉，
  // 于是走了手机版布局 —— 表现为字小、被裁、按钮点不到。
  // 现在放宽到：短边 ≤ 540 且对角 ≤ 820（手机 393x852 对角 938，仍会被排除）。
  if (short <= 540 && diag <= 820) return true
  // 方形或近似方形的中等屏（很多方形表是 480~520）
  if (short <= 540 && long / short <= 1.25) return true
  return false
}

/** 取当前窗口尺寸（dp），带兜底 */
const getSize = (): { width: number, height: number } => {
  const size = windowSizeTools.getSize()
  if (size.width > 0 && size.height > 0) return size
  try {
    const win = Dimensions.get('window')
    return { width: win.width, height: win.height }
  } catch (err) {
    return { width: 0, height: 0 }
  }
}

/** 惰性求值 + 缓存：第一次真正需要时才判定，避免导入期为 0 */
const computeIsWatch = (): boolean => {
  // 用户手动指定优先
  const mode = settingState.setting?.['common.uiMode']
  if (mode === 'watch') return true
  if (mode === 'phone') return false
  const { width, height } = getSize()
  const hit = detectWatch(width, height)
  _uiScale = hit ? (Math.min(width, height) >= 400 ? 0.88 : 0.82) : 1
  return hit
}

export const initWatchMode = (width?: number, height?: number) => {
  const mode = settingState.setting?.['common.uiMode']
  if (mode === 'watch') {
    _isWatch = true
    _uiScale = 0.88
    return _isWatch
  }
  if (mode === 'phone') {
    _isWatch = false
    _uiScale = 1
    return _isWatch
  }
  if (width && height) {
    _isWatch = detectWatch(width, height)
    _uiScale = _isWatch ? (Math.min(width, height) >= 400 ? 0.88 : 0.82) : 1
  } else {
    _isWatch = computeIsWatch()
  }
  return _isWatch
}

export const isWatch = (): boolean => {
  // 每次都要检查用户指定（缓存值可能在用户选择之前就算好了）
  const mode = settingState.setting?.['common.uiMode']
  if (mode === 'watch') return true
  if (mode === 'phone') return false
  if (_isWatch === null) _isWatch = computeIsWatch()
  return _isWatch
}

/** 小屏整体 UI 缩放系数（1 = 不缩放） */
export const getUIScale = (): number => {
  if (_isWatch === null) _isWatch = computeIsWatch()
  return _uiScale
}

/** 屏幕方向变化时重新判定 */
export const refreshWatchMode = () => {
  _isWatch = computeIsWatch()
  return _isWatch
}
