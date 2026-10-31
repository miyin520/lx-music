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
      style={[styles.searchBar, { borderBottomColor: theme['c-border-background'], height: compact ? 70 : 38, flexWrap: compact ? 'wrap' : 'nowrap' }]}
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
    zIndex: 2,
    paddingRight: 10,
    borderBottomWidth: BorderWidths.normal,
  },
  selector: {
    // width: 86,
  },
  compactInputRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
  },
  compactBottomRow: {
    width: '100%',
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
