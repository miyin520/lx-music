import { useRef, forwardRef, useImperativeHandle, useState } from 'react'
import { View } from 'react-native'

// import music from '@/utils/musicSdk'
import { BorderWidths } from '@/theme'
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
  // 表盘上放不下「来源 + 输入框 + 类型」一行（320x320 的 Kido 尤其明显），
  // 宽度不超过 360dp 就拆成两行：搜索框独占一行，来源与类型放第二行
  const [barWidth, setBarWidth] = useState(0)
  const compact = barWidth > 0 && barWidth <= 360

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
          height: compact ? 58 : 38,
          flexWrap: compact ? 'wrap' : 'nowrap',
          // 不透明底色 + zIndex：搜索栏永远压在结果列表之上，列表滚动时不会从它下面透出来
          backgroundColor: theme['c-content-background'],
        },
      ]}
      onLayout={(e) => { setBarWidth(e.nativeEvent.layout.width) }}
    >
      { compact
        ? (
            <>
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
            </>
          )
        : (
            <>
              <View style={styles.selector}>
                <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} center />
              </View>
              <SearchInput
                ref={searchInputRef}
                onChangeText={onTipSearch}
                onSubmit={onSearch}
                onBlur={onHideTipList}
                onTouchStart={onShowTipList}
              />
              {/* 结果类型切换：歌曲 / 歌单 */}
              <View style={styles.typeSwitch}>
                <SearchTypeSelector />
              </View>
            </>
          )
      }
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
