import { createContext, useContext } from 'react'

/**
 * 拖动面板里的滑条时，临时锁住外层 ScrollView 的滚动。
 *
 * 现象：在「播放器设置」面板里上下滑动很容易卡死 ——
 * 滑条是原生组件，和外层 ScrollView 抢手势，ScrollView 抢到后又收不回，
 * 整个界面就不再响应触摸。锁住滚动后，拖滑条期间不会再有这个竞争。
 */
export const PopupScrollLockContext = createContext<(locked: boolean) => void>(() => {})

export const usePopupScrollLock = () => useContext(PopupScrollLockContext)
