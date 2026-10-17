/**
 * 播放页「加入播放列表」选择器
 *
 * 表盘上没法用系统的长按菜单，这里做成整屏选择：
 * 点列表名 = 加入该列表；已在列表里再点一次 = 移出。
 */
import { memo, useCallback, useEffect, useState } from 'react'
import { View, TouchableOpacity, ScrollView } from 'react-native'

import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { useMyList } from '@/store/list/hook'
import { addListMusics, removeListMusics, getListMusics, createList } from '@/core/list'
import { toast } from '@/utils/tools'
import { createStyle } from '@/utils/tools'

const AddToListModal = memo(({ musicInfo, onClose, m }: {
  musicInfo: LX.Music.MusicInfo
  onClose: () => void
  m: { fontSm: number, fontMd: number, side: number, touch: number, iconMd: number }
}) => {
  const theme = useTheme()
  const lists = useMyList()
  // 每个列表里是否已包含这首歌
  const [inLists, setInLists] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void (async() => {
      const map: Record<string, boolean> = {}
      for (const list of lists) {
        try {
          const musics = await getListMusics(list.id)
          map[list.id] = musics.some(s => s.id === musicInfo.id)
        } catch (err) {
          map[list.id] = false
        }
      }
      if (alive) setInLists(map)
    })()
    return () => { alive = false }
  }, [lists, musicInfo.id])

  const toggle = useCallback(async(listId: string, listName: string) => {
    if (busy) return
    setBusy(listId)
    try {
      if (inLists[listId]) {
        await removeListMusics(listId, [musicInfo.id])
        setInLists(prev => ({ ...prev, [listId]: false }))
        toast(`已从「${listName}」移除`)
      } else {
        await addListMusics(listId, [musicInfo], 'top')
        setInLists(prev => ({ ...prev, [listId]: true }))
        toast(`已加入「${listName}」`)
      }
    } catch (err: any) {
      toast(`操作失败：${err.message}`, 'long')
    } finally {
      setBusy(null)
    }
  }, [busy, inLists, musicInfo])

  const createAndAdd = useCallback(async() => {
    if (busy) return
    setBusy('__new__')
    try {
      const name = `列表 ${lists.length - 1}`
      // 建新列表的同时把当前歌曲放进去
      await createList({ name, list: [musicInfo] })
      toast(`已新建「${name}」并加入`)
    } catch (err: any) {
      toast(`新建失败：${err.message}`, 'long')
    } finally {
      setBusy(null)
    }
  }, [busy, lists.length, musicInfo])

  return (
    <View style={[styles.mask, { padding: m.side }]}>
      <View style={[styles.panel, { backgroundColor: theme['c-content-background'] }]}>
        <View style={[styles.titleRow, { paddingHorizontal: m.side * 0.7 }]}>
          <Text size={m.fontSm} color={theme['c-500']} numberOfLines={1} style={{ flex: 1 }}>加入播放列表</Text>
          <TouchableOpacity
            style={{ width: m.touch, height: m.touch, alignItems: 'center', justifyContent: 'center' }}
            onPress={onClose}
            activeOpacity={0.6}
          >
            <Icon name="close" size={m.iconMd} color={theme['c-500']} />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ maxHeight: 340 }}>
          {
            lists.map((list) => {
              const checked = !!inLists[list.id]
              return (
                <TouchableOpacity
                  key={list.id}
                  style={[styles.item, { minHeight: m.touch + 6, paddingHorizontal: m.side * 0.7 }]}
                  activeOpacity={0.6}
                  onPress={() => { void toggle(list.id, list.name) }}
                >
                  <Icon
                    name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={m.iconMd}
                    color={checked ? theme['c-primary'] : theme['c-500']}
                  />
                  <Text size={m.fontMd} numberOfLines={1} style={{ flex: 1, paddingLeft: m.side * 0.4 }}>{list.name}</Text>
                  {busy === list.id ? <Text size={m.fontSm} color={theme['c-500']}>…</Text> : null}
                </TouchableOpacity>
              )
            })
          }
        </ScrollView>
        {/* 新建自定义列表 */}
        <TouchableOpacity
          style={[styles.item, { minHeight: m.touch + 6, paddingHorizontal: m.side * 0.7 }]}
          activeOpacity={0.6}
          onPress={() => { void createAndAdd() }}
        >
          <Icon name="add-music" size={m.iconMd} color={theme['c-primary']} />
          <Text size={m.fontMd} style={{ flex: 1, paddingLeft: m.side * 0.4 }} color={theme['c-primary']}>新建列表</Text>
          {busy === '__new__' ? <Text size={m.fontSm} color={theme['c-500']}>…</Text> : null}
        </TouchableOpacity>
      </View>
    </View>
  )
})

const styles = createStyle({
  mask: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 200,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  panel: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})

export default AddToListModal
