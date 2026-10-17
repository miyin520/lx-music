"use strict";

// 纯 JS 版 base64（手表构建用它替掉原生模块，避免编译 C++）
// 注意：不能依赖 global.base64FromArrayBuffer —— 那是原生模块注入的，
// 原版包在纯 JS 回退时也是自己实现，这里补齐。

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const B64_CHARS_URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

const decodeTable = (() => {
  const t = new Int16Array(256).fill(-1)
  for (let i = 0; i < B64_CHARS.length; i++) t[B64_CHARS.charCodeAt(i)] = i
  // url-safe 变体
  t['-'.charCodeAt(0)] = 62
  t['_'.charCodeAt(0)] = 63
  return t
})()

function stringToArrayBuffer(str) {
  const buf = new ArrayBuffer(str.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < str.length; i++) view[i] = str.charCodeAt(i)
  return buf
}

function uint8ArrayToString(array) {
  let out = ''
  const CHUNK = 0x8000
  for (let i = 0; i < array.length; i += CHUNK) {
    out += String.fromCharCode.apply(null, array.subarray(i, Math.min(i + CHUNK, array.length)))
  }
  return out
}

function encode(bytes, urlSafe) {
  const chars = urlSafe ? B64_CHARS_URL : B64_CHARS
  let out = ''
  let i = 0
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
    out += chars[(n >> 18) & 63] + chars[(n >> 12) & 63] + chars[(n >> 6) & 63] + chars[n & 63]
  }
  const rest = bytes.length - i
  if (rest === 1) {
    const n = bytes[i] << 16
    out += chars[(n >> 18) & 63] + chars[(n >> 12) & 63] + '=='
  } else if (rest === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8)
    out += chars[(n >> 18) & 63] + chars[(n >> 12) & 63] + chars[(n >> 6) & 63] + '='
  }
  return out
}

function decode(str, removeLinebreaks) {
  if (removeLinebreaks) str = str.replace(/[\r\n]/g, '')
  const len = str.length
  if (len === 0) return new Uint8Array(0)
  const padding = str[len - 1] === '=' ? (str[len - 2] === '=' ? 2 : 1) : 0
  const bufferLen = (len * 3 >> 2) - padding
  const bytes = new Uint8Array(bufferLen)
  let p = 0
  let acc = 0
  let bits = 0
  for (let i = 0; i < len; i++) {
    const v = decodeTable[str.charCodeAt(i)]
    if (v < 0) continue
    acc = (acc << 6) | v
    bits += 6
    if (bits >= 8) {
      bits -= 8
      if (p < bufferLen) bytes[p++] = (acc >> bits) & 0xff
    }
  }
  return bytes
}

export function byteLength(b64) {
  const len = b64.length
  if (len % 4 > 0) throw new Error('Invalid string. Length must be a multiple of 4')
  const validLen = b64.indexOf('=') === -1 ? len : b64.indexOf('=')
  const placeHoldersLen = validLen === len ? 0 : 4 - (validLen % 4)
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen
}

export function toByteArray(b64, removeLinebreaks = false) {
  return decode(b64, removeLinebreaks)
}

export function fromByteArray(uint8, urlSafe = false) {
  return encode(uint8, urlSafe)
}

export function btoa(data) {
  return encode(new Uint8Array(stringToArrayBuffer(String(data))), false)
}

export function atob(b64) {
  return uint8ArrayToString(decode(b64, false))
}

export function shim() {
  global.btoa = btoa
  global.atob = atob
}

export const getNative = () => ({
  btoa,
  atob,
})

export const trimBase64Padding = str => str.replace(/=+$/, '')
