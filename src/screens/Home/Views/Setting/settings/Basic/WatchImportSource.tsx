import { memo, useCallback, useState } from 'react'
import { View, TouchableOpacity, ScrollView } from 'react-native'

import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { readDir, readFile, externalStorageDirectoryPath } from '@/utils/fs'
import { toast } from '@/utils/tools'
import { handleImportScript } from './UserApiEditModal/action'

/**
 * 手表可用的音源导入入口
 *
 * 原来的导入走 ChoosePath：要么调系统文件选择器（手表上通常没有这个界面，
 * 一调就失败/无反应），要么退回内置文件浏览器（表盘上根本没法点）。
 * 这里改成「扫 Download 目录里的 .js，点一下直接导入」。
 */

const SCAN_DIRS = [
  `${externalStorageDirectoryPath}/Download`,
  externalStorageDirectoryPath,
]

interface JsFile {
  name: string
  path: string
}

const WatchImportSource = memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const [files, setFiles] = useState<JsFile[] | null>(null)
  const [busy, setBusy] = useState(false)

  const scan = useCallback(async() => {
    setBusy(true)
    const found: JsFile[] = []
    for (const dir of SCAN_DIRS) {
      try {
        const list = await readDir(dir)
        for (const f of list) {
          if (f.isFile && /\.js$/i.test(f.name) && !found.some(x => x.path === f.path)) {
            found.push({ name: f.name, path: f.path })
          }
        }
      } catch (err) {
        // 目录不存在就跳过
      }
    }
    setFiles(found)
    setBusy(false)
    if (!found.length) toast('Download 目录里没有 .js 音源文件', 'long')
  }, [])

  const doImport = useCallback(async(path: string) => {
    try {
      const script = await readFile(path)
      if (!script) throw new Error('Read file failed')
      await handleImportScript(script)
      setFiles(null)
    } catch (err: any) {
      toast(`导入失败：${err.message}`, 'long')
    }
  }, [])

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: theme['c-button-background'] }]}
        activeOpacity={0.7}
        onPress={() => { void scan() }}
      >
        <Text size={14} color={theme['c-button-font']}>{busy ? '扫描中…' : t('setting_basic_watch_import_source')}</Text>
      </TouchableOpacity>

      {
        files
          ? <View style={styles.list}>
              <ScrollView style={{ maxHeight: 180 }}>
                {
                  files.map(f => (
                    <TouchableOpacity
                      key={f.path}
                      style={styles.item}
                      activeOpacity={0.6}
                      onPress={() => { void doImport(f.path) }}
                    >
                      <Text size={13} numberOfLines={1}>{f.name}</Text>
                    </TouchableOpacity>
                  ))
                }
              </ScrollView>
            </View>
          : null
      }
    </View>
  )
})

const styles = createStyle({
  wrap: {
    marginTop: 8,
  },
  btn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  list: {
    marginTop: 6,
  },
  item: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
})

export default WatchImportSource
