import { useRef, forwardRef, useImperativeHandle, useMemo } from 'react'
import { View } from 'react-native'

// import music from '@/utils/musicSdk'
// import InsetShadow from 'react-native-inset-shadow'
import SourceSelector, {
  type SourceSelectorType as _SourceSelectorType,
  type SourceSelectorProps as _SourceSelectorProps,
} from '@/components/SourceSelector'
import SearchInput, { type SearchInputType, type SearchInputProps } from './SearchInput'
import SearchTypeSelector from '../SearchTypeSelector'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useFontSize } from '@/store/common/hook'
import { getTextSize } from '@/utils/pixelRatio'
import { type Source as MusicSource } from '@/store/search/music/state'
import { type Source as SonglistSource } from '@/store/search/songlist/state'

type Sources = Readonly<Array<MusicSource | SonglistSource>>
type SourceSelectorProps = _SourceSelectorProps<Sources>
type SourceSelectorType = _SourceSelectorType<Sources>

export interface HeaderBarProps {
  onSourceChange: SourceSelectorProps['onSourceChange']
  onTipSearch: SearchInputProps['onChangeText']
  onSearch: SearchInputProps['onSubmit']
  onHideTipList: SearchInputProps['onBlur']
  onShowTipList: SearchInputProps['onTouchStart']
}

export interface HeaderBarType {
  setSourceList: SourceSelectorType['setSourceList']
  setText: SearchInputType['setText']
  blur: SearchInputType['blur']
}


export default forwardRef<HeaderBarType, HeaderBarProps>(({ onSourceChange, onTipSearch, onSearch, onHideTipList, onShowTipList }, ref) => {
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const searchInputRef = useRef<SearchInputType>(null)
  const theme = useTheme()
  const fontSize = useFontSize()
  // 第二行高度按「当前字号的实际行高」算：14sp 在用户把字体调大后会变高，
  // 固定 26/30 会把文字顶出去，压到下面的联想卡片上（就是看着不衔接的原因）
  const bottomRowH = useMemo(() => Math.max(32, Math.ceil(getTextSize(14) * 1.38) + 8), [fontSize])
  const inputRowH = 34
  const barH = inputRowH + bottomRowH
  // 固定两行布局：搜索框独占一行，来源与类型放第二行。
  //
  // 以前是按宽度在「一行 / 两行」之间切换，两套 JSX 各自挂一个 SourceSelector，
  // 切换的一瞬间旧实例被卸载、新实例重新挂载 —— 而平台列表是父组件在 mount 时
  // 用命令式接口塞进来的，重挂载之后就变成空列表：表现就是「点搜索平台什么都不显示，
  // 而且点过一次以后一直不显示」。现在只有一套结构，永远不会重挂载。

  useImperativeHandle(ref, () => ({
    setSourceList(list, source) {
      sourceSelectorRef.current?.setSourceList(list, source)
    },
    setText(text) {
      searchInputRef.current?.setText(text)
    },
    blur() {
      searchInputRef.current?.blur()
    },
  }), [])


  return (
    <View
      style={[
        styles.searchBar,
        {
          // 两行相加就是搜索栏高度：不留空档，结果列表才能紧贴搜索框
          // 行高压到刚够显示、字号统一到 14 —— 之前来源用的是 15sp，
          // 比「歌曲」大一号，会顶出第二行、压在联想卡片上，看着就不衔接
          height: barH,
          flexWrap: 'wrap',
          // 不透明底色 + zIndex：搜索栏永远压在结果列表之上，列表滚动时不会从它下面透出来
          backgroundColor: theme['c-content-background'],
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          // 行高算错时宁可把文字裁在搜索栏里，也不要让它冒出去压住联想卡片
          overflow: 'hidden',
        },
      ]}
    >
      {/* 第一行：搜索框占满整行 */}
      <View style={[styles.compactInputRow, { height: inputRowH }]}>
        <SearchInput
          ref={searchInputRef}
          onChangeText={onTipSearch}
          onSubmit={onSearch}
          onBlur={onHideTipList}
          onTouchStart={onShowTipList}
        />
      </View>
      {/* 第二行：来源 + 歌曲/歌单切换，各自靠边 */}
      <View style={[styles.compactBottomRow, { height: bottomRowH }]}>
        <View style={styles.selector}>
          <SourceSelector
            ref={sourceSelectorRef}
            onSourceChange={onSourceChange}
            center
            fontSize={14}
            // 和第一行输入框文字对齐：卡片内缩 12 + Input 7 + 自带 5 → 这里也取 12
            paddingLeft={12}
          />
        </View>
        <View style={styles.typeSwitch}>
          <SearchTypeSelector />
        </View>
      </View>
    </View>
  )
})

const styles = createStyle({
  searchBar: {
    flexDirection: 'row',
    height: 38,
    // 搜索栏是独立图层：结果列表与联想列表都必须在它下面
    zIndex: 10,
    // 底色与下方列表一致，去掉分隔横线（表盘上多一条线显得很杂）
  },
  selector: {
    // width: 86,
  },
  compactInputRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    // 加上 Input 自身的 5dp 左内边距，文字正好落在卡片内缩 12dp 的位置
    paddingLeft: 7,
  },
  compactBottomRow: {
    width: '100%',
    // 高度由组件按字号算（见 bottomRowH）
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeSwitch: {
    maxWidth: 120,
    justifyContent: 'center',
    marginLeft: 6,
  },
})
