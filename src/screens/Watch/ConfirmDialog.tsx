/**
 * 表盘风格的确认弹窗
 *
 * 跟「选择音乐平台」那个弹窗同一套观感：居中圆角卡片 + 主色按钮。
 * 原来改字体大小 / 改全面屏用的是系统 Alert，颜色不跟主题、圆角也是系统样式，
 * 在表盘上很突兀。
 */
import { forwardRef, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { Pressable, View } from 'react-native'

import Modal, { type ModalType } from '@/components/common/Modal'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

export interface ConfirmOptions {
  title: string
  message?: string
  okText?: string
  cancelText?: string
}

export interface ConfirmType {
  show: (options: ConfirmOptions) => Promise<boolean>
}

const Component = (props: {}, ref: Ref<ConfirmType>) => {
  const theme = useTheme()
  const modalRef = useRef<ModalType>(null)
  const resolveRef = useRef<((ok: boolean) => void) | null>(null)
  const [options, setOptions] = useState<ConfirmOptions>({ title: '' })

  const finish = (ok: boolean) => {
    // 先把 resolver 取出来再关弹窗：关弹窗会触发 onHide，那里也会 resolve，
    // 顺序反了就会先 resolve(false)，导致「立即重启」永远不生效
    const resolve = resolveRef.current
    resolveRef.current = null
    modalRef.current?.setVisible(false)
    resolve?.(ok)
  }

  useImperativeHandle(ref, () => ({
    show(opts) {
      setOptions(opts)
      modalRef.current?.setVisible(true)
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve
      })
    },
  }))

  return (
    <Modal ref={modalRef} onHide={() => { resolveRef.current?.(false); resolveRef.current = null }}>
      <View style={styles.mask}>
        <View
          style={[styles.card, { backgroundColor: theme['c-content-background'], borderColor: theme['c-border-background'] }]}
          onStartShouldSetResponder={() => true}
        >
          <Text size={15} color={theme['c-font']} style={styles.title} numberOfLines={2}>{options.title}</Text>
          { options.message
            ? <Text size={13} color={theme['c-350']} style={styles.message}>{options.message}</Text>
            : null }
          <View style={styles.footer}>
            <Pressable
              style={[styles.btn, { borderColor: theme['c-border-background'] }]}
              onPress={() => { finish(false) }}
            >
              <Text size={14} color={theme['c-350']}>{options.cancelText ?? '取消'}</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnPrimary, { backgroundColor: theme['c-primary'] }]}
              onPress={() => { finish(true) }}
            >
              <Text size={14} color="#FFFFFF">{options.okText ?? '确定'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default forwardRef(Component) as (p: {} & { ref?: Ref<ConfirmType> }) => JSX.Element | null

const styles = createStyle({
  mask: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 16,
    borderWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 16,
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
