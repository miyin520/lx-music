// import { requestStoragePermission } from '@/utils/common'
import { temporaryDirectoryPath, existsFile, appendFile, unlink, writeFile, readFile } from '@/utils/fs'

const logPath = temporaryDirectoryPath + '/error.log'

const logTools = {
  tempLog: [] as Array<{ time: string, type: 'LOG' | 'WARN' | 'ERROR', text: string }> | null,
  writeLog(msg: string) {
    console.log(msg)
    void appendFile(logPath, '\n----lx log----\n' + msg)
  },
  async initLogFile() {
    try {
      let isExists = await existsFile(logPath)
      // console.log(isExists)
      if (!isExists) await writeFile(logPath, '')
      if (this.tempLog?.length) this.writeLog(this.tempLog.map(m => `${m.time} ${m.type} ${m.text}`).join('\n----lx log----\n'))
      this.tempLog = null
    } catch (err) {
      console.log(err)
    }
  },
}

/**
 * 启动打点
 * 每次冷启动写一行，崩溃后可通过"设置-分享错误日志"看出进程走到哪一步
 */
export const logAppStart = () => {
  const time = new Date().toLocaleString()
  void (async() => {
    // 上一次启动如果没走到 "startup complete"，说明是启动阶段中断（崩溃/被杀）
    try {
      const content = await readFile(logPath)
      const lines = content.split('\n').filter((line: string) => line.trim())
      const last = lines[lines.length - 1] ?? ''
      if (lines.length && last.includes('boot:') && !last.includes('startup complete')) {
        logTools.writeLog(`boot: 上次启动未走完（最后一步：${last.replace(/^\d{4}\/\d{1,2}\/\d{1,2} .{8} LOG /, '')}）`)
      }
    } catch {}
    logTools.writeLog(`==== APP START ${time} v${process.versions.app ?? '?'} ====`)
  })()
}

export const init = async() => {
  return logTools.initLogFile()
}

export const getLogs = async() => {
  return readFile(logPath)
}

export const clearLogs = async() => {
  return unlink(logPath).then(async() => writeFile(logPath, ''))
}

export const log = {
  info(...msgs: any[]) {
    // console.info(...msgs)
    const msg = msgs.map(m => typeof m == 'string' ? m : m instanceof Error ? m.stack ?? m.message : JSON.stringify(m)).join(' ')
    if (msg.startsWith('%c')) return
    const time = new Date().toLocaleString()
    if (logTools.tempLog) {
      logTools.tempLog.push({ type: 'LOG', time, text: msg })
    } else logTools.writeLog(`${time} LOG ${msg}`)
  },
  warn(...msgs: any[]) {
    // console.warn(...msgs)
    const msg = msgs.map(m => typeof m == 'string' ? m : m instanceof Error ? m.stack ?? m.message : JSON.stringify(m)).join(' ')
    const time = new Date().toLocaleString()
    if (logTools.tempLog) {
      logTools.tempLog.push({ type: 'WARN', time, text: msg })
    } else logTools.writeLog(`${time} WARN ${msg}`)
  },
  error(...msgs: any[]) {
    const msg = msgs.map(m => typeof m == 'string' ? m : m instanceof Error ? m.stack ?? m.message : JSON.stringify(m)).join(' ')
    const time = new Date().toLocaleString()
    if (logTools.tempLog) {
      logTools.tempLog.push({ type: 'ERROR', time, text: msg })
    } else {
      logTools.writeLog(`${time} ERROR ${msg}`)
    }
  },
}
/*
if (process.env.NODE_ENV !== 'development') {
  const logPath = externalDirectoryPath + '/debug.log'

  let tempLog = []

  const log = window.console.log
  const error = window.console.error
  const warn = window.console.warn

  const writeLog = msg => appendFile(logPath, '\n' + msg)

  window.console.log = (...msgs) => {
    log(...msgs)
    const msg = msgs.map(m => typeof m == 'string' ? m : JSON.stringify(m)).join(' ')
    if (msg.startsWith('%c')) return
    const time = new Date().toLocaleString()
    if (tempLog) {
      tempLog({ type: 'LOG', time, text: msg })
    } else writeLog(`${time} LOG ${msg}`)
  }
  window.console.error = (...msgs) => {
    error(...msgs)
    const msg = msgs.map(m => typeof m == 'string' ? m : JSON.stringify(m)).join(' ')
    const time = new Date().toLocaleString()
    if (tempLog) {
      tempLog({ type: 'ERROR', time, text: msg })
    } else writeLog(`${time} ERROR ${msg}`)
  }
  window.console.warn = (...msgs) => {
    warn(...msgs)
    const msg = msgs.map(m => typeof m == 'string' ? m : JSON.stringify(m)).join(' ')
    const time = new Date().toLocaleString()
    if (tempLog) {
      tempLog({ type: 'WARN', time, text: msg })
    } else writeLog(`${time} WARN ${msg}`)
  }

  const init = async() => {
    try {
      let result = await requestStoragePermission()
      if (!result) return
      let isExists = await existsFile(logPath)
      console.log(logPath, isExists)
      if (!isExists) await writeFile(logPath, '')
      writeLog(tempLog(m => `${m.time} ${m.type} ${m.text}`).join('\n'))
      tempLog = null
    } catch (err) {
      console.error(err)
    }
  }


  init()
}

 */
