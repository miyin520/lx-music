"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.binaryMd5 = binaryMd5;
exports.stringMd5 = stringMd5;

var _reactNative = require("react-native");

var _sparkMd = _interopRequireDefault(require("spark-md5"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const g = global;
const Md5Module = _reactNative.NativeModules.QuickMd5;

if (Md5Module && typeof Md5Module.install === 'function') {
  Md5Module.install();
}

function stringToArrayBuffer(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);

  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }

  return buf;
}

function stringMd5(data) {
  if (typeof g.md5FromArrayBuffer !== 'undefined') {
    return g.md5FromArrayBuffer(data);
  } else {
    const spark = new _sparkMd.default();
    spark.append(data);
    return spark.end();
  }
}

function binaryMd5(data) {
  data = typeof data === 'string' ? stringToArrayBuffer(data) : data;

  if (typeof g.md5FromArrayBuffer !== 'undefined') {
    return g.md5FromArrayBuffer(data);
  } else {
    const spark = new _sparkMd.default.ArrayBuffer();
    spark.append(data);
    return spark.end();
  }
}
//# sourceMappingURL=index.js.map