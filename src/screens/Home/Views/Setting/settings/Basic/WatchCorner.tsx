import { memo, useMemo, useRef, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import Text from '@/components/common/Text'
import Modal, { type ModalType } from '@/components/common/Modal'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

/**
 * 表盘圆角半径
 *
 * 圆角很大的表盘会把贴边的文字切掉（搜索框第一行、导航栏最上/最下）。
 * Android 12 及以上能向系统读真实半径，但大部分手表还在 12 以下 —— 读不到，
 * 所以这里让用户自己填。
 *
 * 表盘上弹系统输入法经常没反应（有的 ROM 干脆没有软键盘），
 * 所以不依赖输入法：点一下数值框弹出内置数字键盘，点数字就能填。
 *
 * 值 = 圆角半径（dp）：
 *  -1（「自动」）= 读系统值，读不到按屏幕尺寸估算
 *   0           = 方角屏，不做避让
 *  1~150        = 按填的半径避让
 */
const MAX = 150

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const current = useSettingValue('common.watchCornerRadius')
  const modalRef = useRef<ModalType>(null)
  // 正在编辑的数字串，空串 = 自动
  const [buf, setBuf] = useState('')

  const open = () => {
    setBuf(current >= 0 ? String(current) : '')
    modalRef.current?.setVisible(true)
  }

  const press = (key: string) => {
    if (key == 'del') {
      setBuf(v => v.slice(0, -1))
      return
    }
    if (key == 'auto') {
      setBuf('')
      return
    }
    setBuf(v => {
      const next = (v + key).replace(/^0+(?=\d)/, '')
      if (next.length > 3) return v
      return Number(next) > MAX ? String(MAX) : next
    })
  }

  const confirm = () => {
    const value = buf ? Math.min(Number(buf), MAX) : -1
    if (value != current) updateSetting({ 'common.watchCornerRadius': value })
    modalRef.current?.setVisible(false)
  }

  const label = useMemo(() => current >= 0 ? String(current) : t('setting_basic_watch_corner_auto'), [current, t])

  const renderKey = (key: string, text: string) => (
    <TouchableOpacity
      key={key}
      activeOpacity={0.7}
      style={[styles.key, { backgroundColor: theme['c-content-background'], borderColor: theme['c-border-background'] }]}
      onPress={() => { press(key) }}
    >
      <Text size={16} color={theme['c-font']}>{text}</Text>
    </TouchableOpacity>
  )

  return (
    <SubTitle title={t('setting_basic_watch_corner')}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={open}
        style={[styles.box, { backgroundColor: theme['c-content-background'], borderColor: theme['c-border-background'] }]}
      >
        <Text size={14} color={theme['c-primary']} numberOfLines={1}>{label}</Text>
        <Text size={11} color={theme['c-350']} style={styles.unit}>dp</Text>
      </TouchableOpacity>

      <Modal ref={modalRef}>
        <View style={styles.mask}>
          <View
            style={[styles.card, { backgroundColor: theme['c-content-background'], borderColor: theme['c-border-background'] }]}
            // 卡片区域自己吃掉点击，别让背景的「点外面关闭」误触发
            onStartShouldSetResponder={() => true}
          >
            <Text size={13} color={theme['c-350']} style={styles.cardTitle}>{t('setting_basic_watch_corner')}</Text>
            <View style={[styles.valueBox, { borderColor: theme['c-border-background'] }]}>
              <Text size={20} color={buf ? theme['c-font'] : theme['c-350']}>
                {buf || t('setting_basic_watch_corner_auto')}
              </Text>
              <Text size={11} color={theme['c-350']} style={styles.unit}>dp</Text>
            </View>

            <View style={styles.grid}>
              {KEYS.map(k => renderKey(k, k))}
              {renderKey('auto', t('setting_basic_watch_corner_auto'))}
              {renderKey('0', '0')}
              {renderKey('del', '⌫')}
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.btn, { borderColor: theme['c-border-background'] }]}
                onPress={() => { modalRef.current?.setVisible(false) }}
              >
                <Text size={14} color={theme['c-350']}>{t('dialog_cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.btn, styles.btnPrimary, { backgroundColor: theme['c-primary'] }]}
                onPress={confirm}
              >
                <Text size={14} color="#FFFFFF">{t('dialog_confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SubTitle>
  )
})

const styles = createStyle({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 92,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
  },
  unit: {
    marginLeft: 4,
  },
  mask: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 260,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  valueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  key: {
    width: '33.33%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: -1,
    marginRight: -1,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  btn: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  btnPrimary: {
    borderWidth: 0,
  },
})
