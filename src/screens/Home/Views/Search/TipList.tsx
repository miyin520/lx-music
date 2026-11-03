import { useRef, useImperativeHandle, forwardRef, useState, useEffect, useMemo } from 'react'
import { View } from 'react-native'
import SearchTipList, { type SearchTipListProps as _SearchTipListProps, type SearchTipListType as _SearchTipListType } from '@/components/SearchTipList'
import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { scaleSizeH, setSpText } from '@/utils/pixelRatio'
import { useFontSize } from '@/store/common/hook'
import { isWatch } from '@/utils/watchMode'
import musicSdk from '@/utils/musicSdk'
import searchState, { type InitState as SearchState } from '@/store/search/state'
import { setSearchText, setTipList, setTipListInfo } from '@/core/search/search'
import { debounce } from '@/utils'

/** 一行联想词的高度：表盘上要按得着，至少 40dp */
/** 联想行的最小高度（真实高度还要跟当前字号取 max，见组件里的 itemHeight） */
export const ITEM_HEIGHT = isWatch() ? 46 : scaleSizeH(36)

/** 联想词最多显示多少条：再多也点不过来，超过就让列表自己滚 */
const MAX_TIP = 20

export const debounceTipSearch = debounce((keyword: string, source: SearchState['temp_source'], callback: (list: string[]) => void) => {
  // console.log(reslutList)
  void musicSdk[source].tipSearch.search(keyword).then(callback)
}, 200)


export type SearchTipListProps = _SearchTipListProps<string>
export type SearchTipListType = _SearchTipListType<string>

interface TipListProps {
  onSearch: (keyword: string) => void
}
export interface TipListType {
  search: (keyword: string, height: number) => void
  show: (height: number) => void
  hide: () => void
}

export default forwardRef<TipListType, TipListProps>(({ onSearch }, ref) => {
  const theme = useTheme()
  const fontSize = useFontSize()
  // 行高跟着字号走：字体调大时行也变高，文字不会被裁
  const itemHeight = useMemo(() => {
    if (!isWatch()) return ITEM_HEIGHT
    return Math.max(Math.ceil(setSpText(15) * 1.38) + 12, ITEM_HEIGHT)
  }, [fontSize])
  const searchTipListRef = useRef<SearchTipListType>(null)
  // 当前关键词：渲染时用来把命中的那几个字标成主题色
  const keywordRef = useRef('')
  const [visible, setVisible] = useState(false)
  const visibleListRef = useRef(false)
  const isUnmountedRef = useRef(false)

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  const applyList = (keyword: string, list: string[]) => {
    keywordRef.current = keyword
    // 去重 + 截断：联想接口偶尔会重复给同一条，重复的 key 会让列表渲染错位
    const clean = Array.from(new Set(list.filter(Boolean))).slice(0, MAX_TIP)
    setTipList(clean)
    if (!visibleListRef.current || isUnmountedRef.current) return
    searchTipListRef.current?.setList(clean)
  }

  const handleSearch = (keyword: string, height: number) => {
    searchTipListRef.current?.setHeight(height)
    setSearchText(keyword)
    if (keyword) {
      setTipListInfo(keyword, searchState.temp_source)
      debounceTipSearch(keyword, searchState.temp_source, (list) => {
        if (keyword != searchState.tipListInfo.text) return
        applyList(keyword, list)
      })
    } else {
      setTipListInfo(keyword, searchState.temp_source)
      applyList(keyword, [])
    }
  }

  const handleShowList = (height: number) => {
    searchTipListRef.current?.setHeight(height)
    if (searchState.tipListInfo.list.length) {
      visibleListRef.current = true
      keywordRef.current = searchState.tipListInfo.text
      searchTipListRef.current?.setList(Array.from(new Set(searchState.tipListInfo.list.filter(Boolean))).slice(0, MAX_TIP))
    }
  }

  useImperativeHandle(ref, () => ({
    search(keyword, height) {
      if (visible) handleSearch(keyword, height)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleSearch(keyword, height)
        })
      }
    },
    show(height) {
      visibleListRef.current = true
      if (visible) handleShowList(height)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShowList(height)
        })
      }
    },
    hide() {
      requestAnimationFrame(() => {
        visibleListRef.current = false
        searchTipListRef.current?.setList([])
      })
    },
  }), [visible])

  // 把联想词里命中关键词的部分标成主题色，一眼能看出"为什么给我这条"
  const renderLabel = (text: string) => {
    const keyword = keywordRef.current.trim()
    const index = keyword ? text.toLowerCase().indexOf(keyword.toLowerCase()) : -1
    if (index < 0) return <Text numberOfLines={1} size={15}>{text}</Text>
    return (
      <Text numberOfLines={1} size={15}>
        {text.slice(0, index)}
        <Text numberOfLines={1} size={15} color={theme['c-primary']}>{text.slice(index, index + keyword.length)}</Text>
        {text.slice(index + keyword.length)}
      </Text>
    )
  }

  const renderItem: SearchTipListProps['renderItem'] = ({ item }) => {
    return (
      <Button style={[styles.item, { height: itemHeight }]} onPress={() => { onSearch(item) }} key={item}>
        {renderLabel(item)}
      </Button>
    )
  }
  const getkey: SearchTipListProps['keyExtractor'] = (item) => item
  const getItemLayout: SearchTipListProps['getItemLayout'] = (data, index) => {
    return { length: itemHeight, offset: itemHeight * index, index }
  }

  return (
    visible
      ? <SearchTipList
          ref={searchTipListRef}
          renderItem={renderItem}
          onPressBg={() => searchTipListRef.current?.setList([])}
          keyExtractor={getkey}
          getItemLayout={getItemLayout}
        />
      : null
  )
})


const styles = createStyle({
  item: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    // 与搜索栏里文字的左边距一致（卡片内缩 12 + 这里 12），整块内容落在同一条竖线上
    paddingLeft: isWatch() ? 12 : 15,
    paddingRight: isWatch() ? 12 : 15,
  },
})
