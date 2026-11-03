import { Dimensions, StatusBar } from 'react-native'
import { getWindowSize as getWindowSizeRaw } from './nativeModules/utils'
// import { log } from './log'

export type SizeHandler = (size: { width: number, height: number }) => void
export const getWindowSize = async() => {
  return getWindowSizeRaw().then((size) => {
    const scale = Dimensions.get('window').scale
    size.width = size.width / scale
    size.height = size.height / scale
    return size
  })
}

export const windowSizeTools = {
  size: {
    width: 0,
    height: 0,
  },
  listeners: [] as SizeHandler[],
  /** 是否已经挂上系统尺寸监听 */
  _bound: false,
  _timer: null as ReturnType<typeof setTimeout> | null,
  getSize() {
    // 异步尺寸还没到位时兜底读 Dimensions，避免调用方拿到 0×0
    if (!this.size.width || !this.size.height) {
      const win = Dimensions.get('window')
      if (win.width > 0 && win.height > 0) {
        return { width: win.width, height: win.height }
      }
    }
    return this.size
  },
  onSizeChanged(handler: SizeHandler) {
    this.listeners.push(handler)

    return () => {
      this.listeners.splice(this.listeners.indexOf(handler), 1)
    }
  },
  async init() {
    // Dimensions.addEventListener('change', () => {
    //   void getWindowSize().then((size) => {
    //     if (!size.width) return
    //     const scale = Dimensions.get('screen').scale
    //     size.width = Math.round(size.width / scale)
    //     size.height = Math.round(size.height / scale) + (StatusBar.currentHeight ?? 0)
    //     this.size = size
    //     for (const handler of this.listeners) handler(size)
    //   })
    // })
    const size = await getWindowSize()
    // log.info('win size', size)
    if (size.width) {
      this.size = size
    } else {
      const window = Dimensions.get('window')
      // log.info('Dimensions window size', window)
      this.size = {
        width: Math.round(window.width),
        height: Math.round(window.height) + (StatusBar.currentHeight ?? 0),
      }
    }
    // 尺寸是异步拿到的，拿到后必须广播一次：
    // 模块级的缩放常量（pixelRatio / watchMode）在导入期算过一次，
    // 不广播就会一直用导入期那个（可能是 0 或全屏）的值 —— 表现为首次启动布局错乱。
    for (const handler of this.listeners) handler(this.size)
    // 监听系统尺寸变化：旋转屏幕、切换全面屏（系统栏显隐）、分屏都会改变可用窗口。
    // 以前这段是注释掉的，尺寸只在启动时读一次 —— 于是横屏启动 / 切完全面屏重启后，
    // 界面还按竖屏那次的尺寸算，看起来就是「UI 变形」。
    if (!this._bound) {
      this._bound = true
      Dimensions.addEventListener('change', () => { this.scheduleRefresh() })
    }
    // console.log('init windowSizeTools')
    return size
  },

  /** 防抖重新读取尺寸（旋转/全面屏切换时事件会连着来几次） */
  scheduleRefresh(delay = 150) {
    if (this._timer) clearTimeout(this._timer)
    this._timer = setTimeout(() => {
      this._timer = null
      void this.refresh()
    }, delay)
  },

  /** 重新向系统要一次可用窗口尺寸并广播出去 */
  async refresh() {
    try {
      const size = await getWindowSize()
      if (!size.width || !size.height) return
      this.setWindowSize(size.width, size.height)
    } catch (err) {
      // 读不到就保持原值
    }
  },
  setWindowSize(width: number, height: number) {
    this.size = {
      width: Math.round(width),
      height: Math.round(height),
    }
    for (const handler of this.listeners) handler(this.size)
  },
}
