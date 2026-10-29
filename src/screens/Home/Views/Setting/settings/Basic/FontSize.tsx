import { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useI18n } from '@/lang'
import { setFontSize } from '@/core/common'
import { useFontSize } from '@/store/common/hook'
import Text from '@/components/common/Text'
import { getTextSize } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
import { tipDialog } from '@/utils/tools'
import { restartApp } from '@/utils/nativeModules/utils'

// 档位间距拉大：原来 0.8~1.3 每档只差 0.1，在小屏上看不出区别
const LIST = [
  {
    size: 0.9,
    name: 'setting_basic_font_size_80',
  },
  {
    size: 1,
    name: 'setting_basic_font_size_90',
  },
  {
    size: 1.2,
    name: 'setting_basic_font_size_100',
  },
  {
    size: 1.4,
    name: 'setting_basic_font_size_110',
  },
  {
    size: 1.65,
    name: 'setting_basic_font_size_120',
  },
  {
    size: 1.9,
    name: 'setting_basic_font_size_130',
  },
] as const

type SIZE_TYPE = typeof LIST[number]['size']

const useActive = (size: SIZE_TYPE) => {
  const _size = useFontSize()
  const isActive = useMemo(() => _size == size, [_size, size])

  return isActive
}

const Item = ({ size, label }: {
  size: SIZE_TYPE
  label: string
}) => {
  const isActive = useActive(size)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return (
    <CheckBox
      marginRight={8}
      check={isActive}
      label={label}
      onChange={() => {
        if (isActive) return
        setFontSize(size)
        // 字体大小要在界面重建后才完全生效，改完直接提示重启
        void tipDialog({
          title: '字体大小已修改',
          message: '需要重启应用后生效，是否立即重启？',
          btnText: '立即重启',
        }).then(() => { restartApp() })
      }}
      need
    />
  )
}

export default memo(() => {
  const t = useI18n()

  const list = useMemo(() => {
    return LIST.map((item) => ({ size: item.size, name: t(item.name) }))
  }, [t])

  return (
    <SubTitle title={t('setting_basic_font_size')}>
      <View style={styles.list}>
        {
          list.map(({ size, name }) => <Item key={size} size={size} label={name} />)
        }
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
