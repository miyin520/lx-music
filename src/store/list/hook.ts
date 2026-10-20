import { useEffect, useState } from 'react'
import state, { type InitState } from './state'
import { getListMusics } from '@/core/list'

export const useMyList = () => {
  const [lists, setList] = useState(state.allList)
  // 防御：列表数据未就绪时 allList 可能为空数组，直接取下标会抛异常
  if (lists[0]) lists[0].name = global.i18n.t('list_name_default')
  if (lists[1]) lists[1].name = global.i18n.t('list_name_love')

  useEffect(() => {
    const handleConfigUpdate = (keys: Array<keyof LX.AppSetting>) => {
      if (!keys.includes('common.langId')) return
      setList((lists) => {
        if (lists[0]) lists[0].name = global.i18n.t('list_name_default')
        if (lists[1]) lists[1].name = global.i18n.t('list_name_love')
        return [...lists]
      })
    }
    global.state_event.on('mylistUpdated', setList)
    global.state_event.on('configUpdated', handleConfigUpdate)
    return () => {
      global.state_event.off('mylistUpdated', setList)
      global.state_event.off('configUpdated', handleConfigUpdate)
    }
  }, [])

  return lists
}

export const useActiveListId = () => {
  const [id, setId] = useState(state.activeListId)

  useEffect(() => {
    global.state_event.on('mylistToggled', setId)
    return () => {
      global.state_event.off('mylistToggled', setId)
    }
  }, [])

  return id
}


export const useMusicList = () => {
  const [list, setList] = useState<LX.List.ListMusics>([])

  useEffect(() => {
    let disposed = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let retryCount = 0
    // 请求序号：快速切换列表时，旧请求可能后返回并把新列表覆盖成旧数据
    let requestId = 0

    const load = (listId?: string) => {
      // 兜底：activeListId 为空串时按「我的列表」读取，避免永远拿到空数组
      const id = listId || state.activeListId || 'default'
      const current = ++requestId
      void getListMusics(id).then((musics) => {
        if (disposed || current != requestId) return
        setList([...musics])
        // 首次启动时数据库/列表可能尚未加载完成，此时会拿到空数组。
        // 以前只有「切换列表」才会重新读取，于是列表一直空着；
        // 这里对空结果做有限次重试，避免必须手动切换一次才显示。
        if (!musics.length && retryCount < 3) {
          retryCount++
          if (retryTimer) clearTimeout(retryTimer)
          retryTimer = setTimeout(() => {
            retryTimer = null
            load()
          }, 400 * retryCount)
        }
      })
    }

    const handleToggle = (activeListId: string) => {
      retryCount = 0
      load(activeListId)
    }
    const handleChange = (ids: string[]) => {
      if (!ids.includes(state.activeListId)) return
      retryCount = 0
      load()
    }
    // 用户列表数据加载完成（启动时）
    const handleListsUpdated = () => {
      retryCount = 0
      load()
    }

    global.state_event.on('mylistToggled', handleToggle)
    global.app_event.on('myListMusicUpdate', handleChange)
    global.state_event.on('mylistUpdated', handleListsUpdated)

    load()

    return () => {
      disposed = true
      if (retryTimer) clearTimeout(retryTimer)
      global.state_event.off('mylistToggled', handleToggle)
      global.app_event.off('myListMusicUpdate', handleChange)
      global.state_event.off('mylistUpdated', handleListsUpdated)
    }
  }, [])

  return list
}

export const useMusicExistsList = (list: LX.List.MyListInfo, musicInfo: LX.Music.MusicInfo) => {
  const [isExists, setExists] = useState(false)

  useEffect(() => {
    void getListMusics(list.id).then((musics) => {
      setExists(musics.some(s => s.id == musicInfo.id))
    })
  }, [list.id, musicInfo.id])

  return isExists
}

export const useListFetching = (listId: string) => {
  const [fetching, setFetching] = useState(!!state.fetchingListStatus[listId])

  useEffect(() => {
    let prevStatus = state.fetchingListStatus[listId]
    const handleUpdate = (status: InitState['fetchingListStatus']) => {
      let currentStatus = status[listId]
      if (currentStatus == null || prevStatus == status[listId]) return
      setFetching(prevStatus = currentStatus)
    }
    global.state_event.on('fetchingListStatusUpdated', handleUpdate)
    return () => {
      global.state_event.off('fetchingListStatusUpdated', handleUpdate)
    }
  }, [listId])

  return fetching
}

