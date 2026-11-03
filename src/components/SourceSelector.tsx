import { forwardRef, type Ref, useImperativeHandle, useMemo, useState } from 'react'
import { View } from 'react-native'

import DorpDownMenu, { type DorpDownMenuProps as _DorpDownMenuProps } from '@/components/common/DorpDownMenu'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'

import { createStyle } from '@/utils/tools'

type Sources = Readonly<Array<LX.OnlineSource | 'all'>>

export interface SourceSelectorProps<S extends Sources> {
  fontSize?: number
  /** 左侧内边距（dp），默认 15；搜索页传小一点好和输入框文字对齐 */
  paddingLeft?: number
  center?: _DorpDownMenuProps<any>['center']
  onSourceChange: (source: S[number]) => void
}

export interface SourceSelectorType<S extends Sources> {
  setSourceList: (list: S, activeSource: S[number]) => void
}

export const useSourceListI18n = (list: Sources) => {
  const t = useI18n()
  // 来源名固定用「原名」：设置项已删除，别名/图片都不再提供
  return useMemo(() => {
    return list.map(s => ({ label: t(`source_real_${s}`), action: s }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, t])
}

const Component = <S extends Sources>({ fontSize = 15, paddingLeft, center, onSourceChange }: SourceSelectorProps<S>, ref: Ref<SourceSelectorType<S>>) => {
  const [list, setList] = useState([] as unknown as S)
  const [source, setSource] = useState<S[number]>('kw')
  const t = useI18n()

  useImperativeHandle(ref, () => ({
    setSourceList(list, activeSource) {
      setList(list)
      setSource(activeSource)
    },
  }), [])

  const sourceList_t = useSourceListI18n(list)

  type DorpDownMenuProps = _DorpDownMenuProps<typeof sourceList_t>

  const handleChangeSource: DorpDownMenuProps['onPress'] = ({ action }) => {
    onSourceChange(action)
    setSource(action)
  }

  return (
    <DorpDownMenu
      menus={sourceList_t}
      center={center}
      onPress={handleChangeSource}
      fontSize={fontSize}
      activeId={source}
    >
      <View style={[styles.sourceMenu, paddingLeft != null ? { paddingLeft, paddingRight: paddingLeft } : null]}>
        <Text style={{ textAlign: center ? 'center' : 'left' }} numberOfLines={1} size={fontSize}>{t(`source_real_${source}`)}</Text>
      </View>
    </DorpDownMenu>
  )
}

export default forwardRef(Component) as <S extends Sources>(p: SourceSelectorProps<S> & { ref?: Ref<SourceSelectorType<S>> }) => JSX.Element | null


const styles = createStyle({
  sourceMenu: {
    height: '100%',
    justifyContent: 'center',
    // paddingTop: 12,
    // paddingBottom: 12,
    paddingLeft: 15,
    paddingRight: 15,
    // backgroundColor: '#ccc',

  },
})
