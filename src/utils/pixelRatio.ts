/**
 * Created by qianxin on 17/6/1.
 * 屏幕工具类
 * ui设计基准,iphone 6
 * width:375
 * height:667
 */
import { Dimensions, PixelRatio } from 'react-native'
import { windowSizeTools } from './windowSizeTools'
import { initWatchMode, getUIScale } from './watchMode'

// 高保真的宽度和高度
const designWidth = 375.0
const designHeight = 667.0

// 获取屏幕的dp（导入期 windowSizeTools 可能还是 0，兜底读 Dimensions）
const rawSize = windowSizeTools.getSize()
const size = (rawSize.width > 0 && rawSize.height > 0)
  ? rawSize
  : (() => {
      const win = Dimensions.get('window')
      return { width: win.width, height: win.height }
    })()
// console.log('size', size)
let screenW = size.width
let screenH = size.height
if (screenW > screenH) {
  const temp = screenW
  screenW = screenH
  screenH = temp
}

// 小屏（手表）适配：初始化并取得整体 UI 缩放系数
initWatchMode(screenW, screenH)

const fontScale = PixelRatio.getFontScale()
const pixelRatio = PixelRatio.get()

let uiScale = getUIScale()
let scale = 1
// 手表字号倍率：保持 1，让字号与结构尺寸同源（都按屏幕尺寸走）。
// 之前给 1.22，字号比容器涨得快，中文字的下半部分就被裁掉了。
const WATCH_TEXT_SCALE = 1.0
let textScale = 1
let minTextSize = 12
let maxTextSize = 22

/**
 * 用当前屏幕尺寸重算所有派生常量。
 * 必须支持重算：窗口尺寸是异步拿到的，导入期那份可能是 0 或全屏尺寸，
 * 不重算就会出现「首次安装进去布局很乱、第二次才好」。
 */
const recompute = () => {
  uiScale = getUIScale()
  if (uiScale === 1) {
    // 手机：沿用原有算法（按设计稿比例 + 像素比）
    const scaleW = PixelRatio.getPixelSizeForLayoutSize(screenW) / designWidth
    const scaleH = PixelRatio.getPixelSizeForLayoutSize(screenH) / designHeight
    scale = Math.min(scaleW, scaleH, 3.1)
  } else {
    // 手表：改用「屏幕尺寸 / 设计尺寸」的几何平均。
    // 原来的算式在表盘上会把结构尺寸压到 0.67 倍（行高 54→36、图标 18→12、按钮 36→24），
    // 而文字却是放大的 —— 于是文字被裁、按钮点不中。
    // 新算式只跟屏幕 dp 尺寸有关，与像素密度无关，且略大于 1 保证可点。
    // 注意：scaleSizeH/W 最终还要除以 pixelRatio，
    // 所以这里要乘回 pixelRatio，让结果落在「屏幕 dp / 设计 dp」这个量级上。
    // 原算式在表盘上会把结构尺寸压成 0.67 倍（行高 54→36、图标 18→12），
    // 而文字是放大的，于是「文字被裁 + 按钮点不中」。
    // 记 R = 屏幕短边 / 设计短边。scaleSizeH/W 会再除以 pixelRatio，uiScale 又在外面乘，
    // 所以要让最终倍数 ≈ R，这里取 scale = pixelRatio × R / uiScale × 1.05。
    // 1.05 是留的一点余量，让行高/图标/按钮比"纯等比"再大一点点（更好点、更好看）。
    const rw = screenW / designWidth
    const rh = screenH / designHeight
    scale = PixelRatio.get() * (Math.sqrt(rw * rh) / uiScale) * 1.05
  }
  const shape = Math.min(screenW / designWidth, screenH / designHeight, 1.3)
  // 手机上沿用原行为（按设计稿比例），手表上用固定倍率保证可读性
  textScale = uiScale === 1 ? shape : WATCH_TEXT_SCALE
  if (uiScale === 1) {
    minTextSize = 0
    maxTextSize = Number.MAX_SAFE_INTEGER
  } else {
    minTextSize = Math.min(screenW, screenH) < 360 ? 12 : 12
    maxTextSize = 20
  }
}
recompute()

// 尺寸变化时重算，保证首次启动就用对的值
windowSizeTools.onSizeChanged((size) => {
  if (!size.width || !size.height) return
  screenW = size.width
  screenH = size.height
  if (screenW > screenH) {
    const temp = screenW
    screenW = screenH
    screenH = temp
  }
  initWatchMode(screenW, screenH)
  recompute()
})

/**
 * 用户改了「字体大小」后调用：重算所有派生尺寸。
 * 之前 `global.lx.fontSize` 只在启动时赋值，改设置后不更新，
 * 于是 getFontScaleFactor() 一直拿旧值 —— 表现为"字号设置没反应"。
 */
export const refreshPixelRatio = () => {
  recompute()
}

/**
 * 读取用户字号设置，永远返回合法数字。
 * 注意：部分模块在 `global.lx.fontSize` 赋值之前就会调用缩放函数，
 * 此时 Math.sqrt(undefined) 会得到 NaN，NaN 进样式会让安卓直接闪退，
 * 所以这里必须兜底。
 */
const getFontScaleFactor = () => {
  const v = Number(global.lx?.fontSize)
  return Number.isFinite(v) && v > 0 ? v : 1
}

/**
 * 小屏（手表）上的字号：
 * 设计基准 375x667，手表只有 410x502，按面积比例抽出来的缩放系数会小得离谱
 * （正文会掉到 10sp），而且层级会被压平、用户改字号也没明显变化。
 * 所以这里改成「一个固定的、可读的基础倍率」，用户字号设置直接乘上去，
 * 保证「标准 < 大 < 更大 < 非常大」是肉眼可见的递进。
 * 手机上保持原有行为不变（设计稿是按手机比例做的）。
 */

/**
 * 设计字号 -> dp（不含用户字号设置，供预览等场景使用）
 */
export function getTextSize(size: number) {
  if (!Number.isFinite(size)) return 12
  let user = getFontScaleFactor()
  // 320x320 这类极小的表盘上，字号一放大整行就会挤在一起，
  // 这里把倍率上限压到 1.15（大字号仍然有变化，但不会把布局撑坏）
  const shortSide = Math.min(screenW, screenH) / pixelRatio
  if (shortSide <= 340 && user > 1.15) user = 1.15
  if (uiScale === 1) {
    // 手机：沿用原算法
    const sw = screenW / designWidth
    const sh = screenH / designHeight
    return Math.floor(size * Math.min(sw, sh, 1.3) / fontScale * user)
  }
  // 手表：设计值直接用（11~18 本来就在可读区间），
  // 只做一点点放大保证最小可读。
  // 上限要跟着用户倍率走：固定 20sp 会把「大 / 更大 / 非常大」几档全压成同一个值。
  const v = size * 1.02 * user
  const upper = Math.round(20 * Math.max(1, user))
  return Math.round(Math.min(Math.max(v, 11), upper))
}

export function setSpText(size: number) {
  return getTextSize(size)
}

/**
 * 设置高度
 * @param size  px
 * @returns dp
 */
export function scaleSizeH(size: number) {
  // console.log(screenPxH / designHeight)
  // let scaleHeight = size * Math.min(screenPxH / designHeight, 3.1)
  let scaleHeight = size * scale * uiScale
  size = Math.floor(scaleHeight / pixelRatio)
  // 结构尺寸跟随「用户字号」只按平方根增长：
  // 字号调到「非常大」时若按 1.3 倍放大，行高会比文字涨得更快导致列表变稀疏；
  // 反过来固定不动又会让多行文字挤在一起。开方是个折中。
  return Math.round(size * Math.sqrt(getFontScaleFactor()))
}

/**
 * 设置宽度
 * @param size  px
 * @returns dp
 */
export function scaleSizeW(size: number) {
  // console.log(screenPxW / designWidth)
  // let scaleWidth = size * Math.min(screenPxW / designWidth, 3.1)
  let scaleWidth = size * scale * uiScale
  size = Math.floor(scaleWidth / pixelRatio)
  return Math.round(size * Math.sqrt(getFontScaleFactor()))
}


export const scaleSizeWR = (size: number) => {
  return size * 2 - scaleSizeW(size)
}

export const scaleSizeHR = (size: number) => {
  return size * 2 - scaleSizeH(size)
}

export const scaleSizeAbsHR = (size: number) => {
  let scaleHeight = size * scale
  return size * 2 - Math.floor(scaleHeight / pixelRatio)
}
