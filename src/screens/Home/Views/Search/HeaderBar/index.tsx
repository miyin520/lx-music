import { useRef, forwardRef, useImperativeHandle } from 'react'
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
          height: 58,
          flexWrap: 'wrap',
          // 不透明底色 + zIndex：搜索栏永远压在结果列表之上，列表滚动时不会从它下面透出来
          backgroundColor: theme['c-content-background'],
        },
      ]}
    >
      {/* 第一行：搜索框占满整行 */}
      <View style={styles.compactInputRow}>
        <SearchInput
          ref={searchInputRef}
          onChangeText={onTipSearch}
          onSubmit={onSearch}
          onBlur={onHideTipList}
          onTouchStart={onShowTipList}
        />
      </View>
      {/* 第二行：来源 + 歌曲/歌单切换，各自靠边 */}
      <View style={styles.compactBottomRow}>
        <View style={styles.selector}>
          <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} center />
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
    paddingRight: 10,
    // 底色与下方列表一致，去掉分隔横线（表盘上多一条线显得很杂）
  },
  selector: {
    // width: 86,
  },
  compactInputRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    // 与 Input 自身的 32 高度一致，上下不留空白
    height: 32,
    paddingLeft: 6,
  },
  compactBottomRow: {
    width: '100%',
    // 来源/类型行压到 26：紧贴搜索框，剩下的高度全部让给结果列表
    height: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // 给左边留点空隙，否则来源名第一个字会贴边被裁
    paddingLeft: 8,
    paddingRight: 4,
  },
  typeSwitch: {
    maxWidth: 120,
    justifyContent: 'center',
    // 整体往右挪一点，别和搜索框贴太近
    marginLeft: 6,
    marginRight: 2,
    paddingRight: 6,
  },
})
