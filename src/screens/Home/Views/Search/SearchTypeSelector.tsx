import { useEffect, useMemo, useState } from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'

import { createStyle } from '@/utils/tools'
import { type SearchType } from '@/store/search/state'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { getSearchSetting } from '@/utils/data'
import { BorderWidths } from '@/theme'

const SEARCH_TYPE_LIST = [
  'music',
  'songlist',
] as const

export default () => {
  const t = useI18n()
  const theme = useTheme()
  const [type, setType] = useState<SearchType>('music')

  useEffect(() => {
    void getSearchSetting().then(info => {
      setType(info.type)
    })
  }, [])

  const list = useMemo(() => {
    return SEARCH_TYPE_LIST.map(type => ({ label: t(`search_type_${type}`), id: type }))
  }, [t])

  const handleTypeChange = (type: SearchType) => {
    setType(type)
    global.app_event.searchTypeChanged(type)
  }

  // 合并成一个按钮：只显示当前类型，点一下切到另一种
  const other = type == 'music' ? 'songlist' : 'music'

  return (
    <TouchableOpacity
      style={styles.single}
      activeOpacity={0.7}
      onPress={() => { handleTypeChange(other as SearchType) }}
    >
      <Text
        size={13}
        color={theme['c-primary-font-active']}
        numberOfLines={1}
        style={styles.singleText}
      >{t(`search_type_${type}`)}</Text>
    </TouchableOpacity>
  )
}

const styles = createStyle({
  single: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleText: {
    // 不再画下划线，靠主题色区分当前类型
    paddingHorizontal: 2,
    paddingVertical: 3,
  },
  container: {
    height: '100%',
    flexGrow: 0,
    flexShrink: 1,
    // paddingLeft: 5,
    // paddingRight: 5,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  button: {
    // height: 38,
    // lineHeight: 38,
    justifyContent: 'center',
    paddingLeft: 8,
    paddingRight: 8,
    // width: 80,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  buttonText: {
    // height: 38,
    // lineHeight: 38,
    textAlign: 'center',
    paddingLeft: 2,
    paddingRight: 2,
    // paddingTop: 10,
    paddingTop: 3,
    paddingBottom: 3,
    // width: 80,
  },
})
