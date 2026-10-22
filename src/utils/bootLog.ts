import { log } from '@/utils/log'

const logs: string[] = []


export const bootLog = (...msgs: any[]) => {
  const line = msgs.map(m => typeof m == 'string' ? m : JSON.stringify(m)).join(' ')
  logs.push(line)
  // 同时落到日志文件：初始化过程中崩溃时，界面里拿不到内存中的启动日志，
  // 只有写进文件才能看出停在哪一步
  log.info(`boot: ${line}`)
}

export const getBootLog = () => {
  return logs.join('\n')
}

