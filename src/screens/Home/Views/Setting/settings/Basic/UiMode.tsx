import { memo, useMemo } from 'react'
import { View } from 'react-native'

import CheckBox from '@/components/common/CheckBox'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'
import { detectWatch } from '@/utils/watchMode'
import { useWindowSize } from '@/utils/hooks'

/**
 * 界面形态
 *
 * 「自动」按屏幕尺寸识别（短边/对角判定）；
 * 也可以直接指定手机版或手表版，避免识别误判。
 * 自动模式下会在选项后面标出当前识别结果。
 */
export default memo(() => {
  const t = useI18n()
  const mode = useSettingValue('common.uiMode')
  const win = useWindowSize()
  const detected = useMemo(() => detectWatch(win.width, win.height), [win.width, win.height])


  return (
    <View style={styles.list}>
      <CheckBox
        marginBottom={4}
        check={mode == 'auto'}
        label={t('setting_basic_ui_mode_auto', { mode: detected ? t('setting_basic_ui_mode_watch') : t('setting_basic_ui_mode_phone') })}
        onChange={() => { updateSetting({ 'common.uiMode': 'auto' }) }}
        need
      />
      <CheckBox
        marginBottom={4}
        check={mode == 'phone'}
        label={t('setting_basic_ui_mode_phone')}
        onChange={() => { updateSetting({ 'common.uiMode': 'phone' }) }}
        need
      />
      <CheckBox
        marginBottom={4}
        check={mode == 'watch'}
        label={t('setting_basic_ui_mode_watch')}
        onChange={() => { updateSetting({ 'common.uiMode': 'watch' }) }}
        need
      />
    </View>
  )
})

const styles = createStyle({
  list: {
    marginTop: 5,
  },
})
