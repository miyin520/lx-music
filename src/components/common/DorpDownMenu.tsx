import { useRef } from 'react'
// import { View } from 'react-native'

import Menu, { type MenuType, type MenuProps, type Menus } from './Menu'
import Button, { type BtnType, type BtnProps } from './Button'
import { isWatch } from '@/utils/watchMode'
// import { useLayout } from '@/utils/hooks'

export interface DorpDownMenuProps<T extends Menus> extends Omit<MenuProps<T>, 'width'> {
  children: React.ReactNode
  btnStyle?: BtnProps['style']
}

export default <T extends Menus>({
  menus,
  onPress,
  height,
  fontSize,
  center,
  children,
  activeId,
  btnStyle,
}: DorpDownMenuProps<T>) => {
  const buttonRef = useRef<BtnType>(null)
  const menuRef = useRef<MenuType>(null)

  const showMenu = () => {
    // 表盘上的菜单是居中卡片，不需要按钮坐标。
    // 以前一律等 measure 回调才 show —— 回调偶尔不触发（视图正在布局/父级改动中），
    // 菜单就永远不出现：用户看到的是「点搜索平台没反应」，而且卡过一次之后后面都不出来。
    if (isWatch()) {
      menuRef.current?.show({ x: 0, y: 0, w: 0, h: 0 })
      return
    }
    buttonRef.current?.measure((fx, fy, width, height, px, py) => {
      // console.log(fx, fy, width, height, px, py)
      menuRef.current?.show({ x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) }, {
        width,
        height,
      })
    })
  }

  return (
    <Button style={btnStyle} ref={buttonRef} onPress={showMenu}>
      {children}
      <Menu
        ref={menuRef}
        menus={menus}
        center={center}
        onPress={onPress}
        fontSize={fontSize}
        height={height}
        activeId={activeId}
      />
    </Button>
  )
}
