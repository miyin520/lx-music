import { Dimensions, PixelRatio } from 'react-native'
import { temporaryDirectoryPath, writeFile } from '@/utils/fs'
import { getSystemInsets } from './insets'
import { getTextSize } from '@/utils/pixelRatio'

/**
 * 表盘布局尺寸：全部按「当前可用窗口」推算，不写死像素。
 *
 * 之前踩的坑：手表像素密度可能远高于虚拟屏，
 * 我按固定像素定尺寸，在真机上被放大数倍，界面直接挤出屏幕。
 * 现在所有尺寸都由 width/height 派生，任何分辨率都不该溢出。
 */
export interface WatchMetrics {
  width: number
  height: number
  /** 可用短边，用于限制字号，避免高密度屏上字过大 */
  short: number
  header: number
  player: number
  row: number
  /** 滚动指示条宽度（可见） */
  barW: number
  /** 滚动指示条触摸区宽度 */
  barTouchW: number
  /** 滚动指示条最小长度 */
  barMin: number
  side: number
  /** 基础字号 */
  fontSm: number
  fontMd: number
  fontLg: number
  iconSm: number
  iconMd: number
  iconLg: number
  btnSm: number
  btnMd: number
  btnLg: number
  /** 统一的最小可点边长（dp），保证任何屏幕上都够大 */
  touch: number
  /** 主页迷你播放条上的按钮边长（比通用可点小一档） */
  playBtn: number
  /** 主页迷你播放条按钮的图标尺寸 */
  playIcon: number
  /** 播放页封面边长（要留出上下标题与页脚空间） */
  cover: number
  /** 左侧列表侧边栏宽度（dp） */
  sidebar: number
  /** 左侧常驻导航栏宽度（dp） */
  rail: number
  /** 纯系统状态栏高度（不含用户留白） */
  sysTop: number
  /** 纯系统底部手势条高度（不含用户留白） */
  sysBottom: number
  /** 系统状态栏高度（dp），0 = 无状态栏；第三方 ROM 上通常 > 0 */
  insetTop: number
  /** 底部手势条/导航栏高度（dp） */
  insetBottom: number
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

export const makeMetrics = (width: number, height: number, userInset = 0): WatchMetrics => {
  const insets = getSystemInsets()
  // 用户在设置里调的「上下留白」也要算进来（表盘界面不经过 PageContent，
  // 所以之前这个设置对表盘是失效的）
  // 用户留白要钳制：字体调大 + 留白调大时，若原样叠加会把内容区挤到没有，
  // 表现为"设置跑到屏幕外"。上限取高度的 8%，并保证内容区至少剩 55%。
  // 可用内容高度要扣掉系统栏，否则第三方 ROM 上顶栏会被状态栏压住
  const w = width > 0 ? width : 320
  const rawH = height > 0 ? height : 320
  const rawInset = Number.isFinite(userInset) && userInset > 0 ? userInset : 0
  const maxInsetEach = Math.max(0, Math.min(rawH * 0.08, (rawH * 0.45 - insets.top - insets.bottom) / 2))
  const extraInset = Math.min(rawInset, Math.max(maxInsetEach, 0))
  const h = Math.max(rawH - insets.top - insets.bottom - extraInset * 2, 120)
  const short = Math.min(w, h)
  // 字号随短边走，但夹在 10~17，避免高密度屏上字大得离谱
  const fs = clamp(short * 0.036, 10, 17)
  // 实际渲染出来的主字号（已包含用户的「字体大小」设置）。
  // 关键高度都跟它取 max —— 否则用户把字体调大后，容器不变高，
  // 文字就会溢出/被裁，看起来像是"上下留白失效"。
  const t15 = getTextSize(15)
  const tSm = getTextSize(11)
  // 关键高度先算出来，封面尺寸要用
  const header = Math.max(h * 0.085, t15 * 2.6)
  const player = Math.max(h * 0.15, t15 * 4.6)
  return {
    width: w,
    height: h,
    short,
    header,
    player,
    // 行内含两行文字（歌名+歌手），按实际行高预留
    row: Math.max(h * 0.105, t15 * 3.6),
    // 指示条：比系统默认粗一倍左右，触摸区再放宽
    barW: Math.max(Math.round(w * 0.018), 7),
    barTouchW: Math.max(Math.round(w * 0.07), 26),
    barMin: Math.max(Math.round(h * 0.06), 30),
    // 左右安全边距：圆角屏四角是 45° 斜切，留白需 ≥ 切角长度的一半。
    // 取屏宽 8.5%（410dp 表盘约 35dp），配合内容区自身留白即可避开常见圆角；
    // 再大就会把可用宽度吃掉太多，界面显得像平板。
    side: Math.max(w * 0.085, 10),
    // 注意：这里必须返回**设计字号**，不能再乘用户倍率。
    // Text 组件内部还会调 setSpText() 应用用户字号设置；
    // 如果这里先乘一次，就会变成双重缩放，高档位被 20sp 上限夹住 → 看起来"设置没反应"。
    fontSm: 11,
    fontMd: 15,
    fontLg: 18,
    // 用户多次反馈图标偏小：这次直接按短边比例给，下限也抬高
    iconSm: clamp(short * 0.075, 20, 32),
    iconMd: clamp(short * 0.095, 26, 40),
    iconLg: clamp(short * 0.125, 32, 52),
    // 用户反馈按钮偏小：统一抬到 44dp 以上（Android 可点目标下限）；
    // 同时按宽度反推上限——播放条上「时间 + 三个按钮」必须放得下，否则窄表上最右侧会被切
    touch: clamp(short * 0.12, 42, w * 0.17),
    // 主页播放条空间紧，三个键做得小一点（用户反馈太大）
    playBtn: clamp(short * 0.095, 34, 42),
    playIcon: clamp(short * 0.075, 16, 24),
    // 封面：原来 0.62 倍短边，上下会被遮挡；收到 0.42 并受剩余高度约束
    cover: Math.max(Math.min(short * 0.42, (h - header - player) * 0.6), 60),
    // 侧边栏占屏宽约四分之一，主区仍有足够宽度显示歌名
    sidebar: clamp(w * 0.26, 54, 110),
    // 常驻导航栏：图标 + 文字，够点即可
    rail: clamp(short * 0.16, 52, 76),
    btnSm: clamp(short * 0.13, 42, w * 0.17),
    btnMd: clamp(short * 0.15, 44, w * 0.19),
    btnLg: clamp(short * 0.19, 48, w * 0.24),
    sysTop: insets.top,
    sysBottom: insets.bottom,
    insetTop: insets.top + extraInset,
    insetBottom: insets.bottom + extraInset,
  }
}

/**
 * 把表盘真实尺寸写进缓存目录，便于用 root 读出来核对布局。
 * （文件位置：/data/data/<包名>/cache/watch-metrics.txt）
 */
export const dumpMetrics = async(m: WatchMetrics): Promise<void> => {
  try {
    const win = Dimensions.get('window')
    const text = [
      `time=${new Date().toISOString()}`,
      `window(dp)=${m.width}x${m.height}`,
      `window(raw)=${win.width}x${win.height}`,
      `screen=${JSON.stringify(Dimensions.get('screen'))}`,
      `pixelRatio=${PixelRatio.get()}`,
      `fontScale=${PixelRatio.getFontScale()}`,
      `--- computed ---`,
      `header=${m.header.toFixed(1)} player=${m.player.toFixed(1)} row=${m.row.toFixed(1)} side=${m.side.toFixed(1)}`,
      `fontSm=${m.fontSm.toFixed(1)} fontMd=${m.fontMd.toFixed(1)} fontLg=${m.fontLg.toFixed(1)}`,
      `iconSm=${m.iconSm.toFixed(1)} iconMd=${m.iconMd.toFixed(1)} iconLg=${m.iconLg.toFixed(1)}`,
      `btnSm=${m.btnSm.toFixed(1)} btnMd=${m.btnMd.toFixed(1)} btnLg=${m.btnLg.toFixed(1)}`,
      `--- 对照 ---`,
      `手机 393x852dp -> header=${(852*0.085).toFixed(1)} player=${(852*0.15).toFixed(1)} row=${(852*0.105).toFixed(1)}`,
      `表盘 410x502dp -> header=${(502*0.085).toFixed(1)} player=${(502*0.15).toFixed(1)} row=${(502*0.105).toFixed(1)}`,
    ].join('\n')
    await writeFile(temporaryDirectoryPath + '/watch-metrics.txt', text)
  } catch (err) {
    // 诊断失败不影响使用
    console.log('dumpMetrics failed', err)
  }
}
