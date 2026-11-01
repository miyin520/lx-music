import { useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle, type Ref } from 'react'
import { Animated, Pressable, StyleSheet, View } from 'react-native'
// import PropTypes from 'prop-types'
// import { AppColors } from '@/theme'
import { useTheme } from '@/store/theme/hook'
import List, { type ItemT, type ListProps, type ListType } from './List'
import { isWatch } from '@/utils/watchMode'
// import InsetShadow from 'react-native-inset-shadow'

export interface SearchTipListProps<T> extends ListProps<T> {
  onPressBg?: () => void
}
export interface SearchTipListType<T> {
  setList: (list: T[]) => void
  setHeight: (height: number) => void
}

const noop = () => {}

/**
 * 搜索联想 / 列表内搜索的下拉列表
 *
 * 重构要点：
 * - 卡片固定在头部下方，宽度铺满、最大高度 80%，内容多了自己滚；
 * - 出现/消失只做透明度过渡（原来是 scaleY 从 0 撑开，表盘上会先看到一条被压扁的横线，
 *   第一行还会被头部压住，看着像列表被切掉了一块）；
 * - 卡片外面整块透明区域接管点按，点空白即收起。
 */
const Component = <T extends ItemT<T>>({ onPressBg = noop, ...props }: SearchTipListProps<T>, ref: Ref<SearchTipListType<T>>) => {
  const theme = useTheme()
  const fade = useRef(new Animated.Value(0)).current
  const [visible, setVisible] = useState(false)
  const [animatePlayed, setAnimatPlayed] = useState(true)
  const listRef = useRef<ListType<T>>(null)
  const prevListRef = useRef<T[]>([])
  const heightRef = useRef(0)

  useImperativeHandle(ref, () => ({
    setList(list) {
      if (prevListRef.current.length) {
        if (!list.length) handleHide()
      } else if (list.length) {
        handleShow()
      }
      prevListRef.current = list
      requestAnimationFrame(() => {
        listRef.current?.setList(list)
      })
    },
    setHeight(height) {
      // 卡片不再按内容高度拉伸，这里只记录，保留接口
      heightRef.current = height
    },
  }))


  const handleShow = useCallback(() => {
    setVisible(true)
    setAnimatPlayed(false)
    requestAnimationFrame(() => {
      fade.setValue(0)
      Animated.timing(fade, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }).start(() => {
        setAnimatPlayed(true)
      })
    })
  }, [fade])

  const handleHide = useCallback(() => {
    setAnimatPlayed(false)
    Animated.timing(fade, {
      toValue: 0,
      duration: 110,
      useNativeDriver: true,
    }).start((finished) => {
      if (!finished) return
      setVisible(false)
      setAnimatPlayed(true)
    })
  }, [fade])


  const component = useMemo(() => (
    <Animated.View style={[styles.anima, { opacity: fade }]} pointerEvents="box-none">
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme['c-content-background'],
            borderColor: theme['c-border-background'],
            borderWidth: isWatch() ? 1 : 0,
            borderTopWidth: 0,
            borderBottomLeftRadius: isWatch() ? 14 : 0,
            borderBottomRightRadius: isWatch() ? 14 : 0,
            overflow: 'hidden',
          },
        ]}
      >
        <List ref={listRef} {...props} />
      </View>
      <Pressable style={styles.blank} onPress={onPressBg} />
    </Animated.View>
  ), [fade, onPressBg, props, theme])

  return !visible && animatePlayed ? null : component
}


export default forwardRef(Component) as
  <T,>(p: SearchTipListProps<T> & { ref?: Ref<SearchTipListType<T>> }) => JSX.Element | null

const styles = StyleSheet.create({
  anima: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: '100%',
    zIndex: 10,
  },
  container: {
    flexGrow: 0,
    flexShrink: 1,
    // flexGrow: 0,
    // borderBottomWidth: BorderWidths.normal,
    elevation: 2,
    maxHeight: '80%',
  },
  blank: {
    flex: 1,
    flexGrow: 1,
    // backgroundColor: 'transparent',
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
})
