<p align="center"><img width="180" src="https://github.com/lyswhut/lx-music-mobile/raw/master/doc/images/icon.png" alt="LX Music"></p>

<h1 align="center">LX 手表版</h1>

<p align="center">
  基于 <a href="https://github.com/lyswhut/lx-music-mobile">LX Music 移动版</a> 1.9.1 修改的<b>手表适配版本</b><br>
  针对 410×502 / 466×466 等小屏圆角表盘重新排版，可独立安装，与官方版共存
</p>

---

## 这是什么

把 LX Music 移动版搬到了智能手表上。**不是官方版本**，是个人修改版，只保证自己手表上能用。

- 包名：`cn.dsh.lxmusic.watch`（**与官方版 `cn.toside.music.mobile` 不冲突，可同时安装**）
- 应用名：LX 手表版
- 基于版本：LX Music 移动版 v1.9.1

## 下载安装

到 [Releases](../../releases) 页面下载最新的 `LX手表版.apk`，传到手表上安装即可。

要求：Android 6.0+、arm64-v8a。

## 手表上做了什么

### 界面

| 部分 | 说明 |
|---|---|
| 左侧导航栏 | 我的列表 / 搜索 / 歌单 / 排行榜 / 设置，常驻显示，点一下直接切 |
| 我的列表 | 顶部 `◁ 列表名 ▷` 切换列表，点中间弹出全屏列表选择（每行带 ⋮ 菜单） |
| 歌曲列表 | 紧凑单行：序号 + 歌名 + 歌手，长按弹出原版歌曲菜单 |
| 播放页 | 封面 / 歌词左右滑动切换，进度条可拖动，歌词支持拖拽调进度 |

### 尺寸适配（全部按屏幕实时计算，不写死像素）

所有尺寸都由当前窗口尺寸推导，换到别的表盘也不会溢出：

```
主字号    = 短边 × 0.036（10~17sp，再乘用户字号倍率）
顶栏      = max(高 × 8.5%,  字号 × 2.6)
播放条    = max(高 × 15%,   字号 × 4.6)
列表行高  = max(高 × 10.5%, 字号 × 3.6)
左右留白  = 宽 × 8.5%（避开圆角）
封面边长  = min(短边 × 42%, 剩余高度 × 60%)
```

顶栏 + 播放条 + 一行歌词 ≈ 屏高 34%，任何字号档位都不会溢出。

### 针对手表做的修改

- **圆角屏避让**：上下留白可调（设置 → 基础 → 上下留白），左右按屏宽比例留白
- **系统栏避让**：读 `StatusBar.currentHeight`，第三方 ROM 上不会被状态栏压住
- **界面形态**：设置 → 基础 → 界面形态，可强制「手机版 / 手表版 / 自动识别」
- **文字行高**：表盘上显式设置 `lineHeight`，修复中文下半部分被裁的问题
- **字号档位**：0.9 / 1.0 / 1.2 / 1.4 / 1.65 / 1.9，改完立即生效
- **音源导入**：设置 → 源 → 「从 Download 目录导入音源」，直接扫目录里的 `.js`
- **去掉更新检查**：包名和版本号与官方不同，更新检查只会误报，已关闭

### 保留的原版功能

歌曲菜单（播放 / 稍后播放 / 添加到 / 移动到 / 调整位置 / 换源 / 分享 / 详情 / 清理缓存 / 不喜欢 / 移除）、
列表菜单（新建 / 重命名 / 排序 / 重复 / 添加本地 / 更新 / 导入 / 导出 / 移除）、
歌词字号与对齐、桌面歌词、定时停止播放、播放器设置、评论页，全部沿用原版实现。

## 从源码构建

```bash
# 需要 Android SDK、JDK 17、Node.js 18+
npm install
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

产物：`android/app/build/outputs/apk/release/*-arm64-v8a.apk`

> ⚠️ 仓库里的 `android/app/build.gradle` 带有原作者本机的绝对路径配置
> （`hermesCommand`、`android.aapt2FromMavenOverride`），换机器构建前需要改成自己的路径。
> 签名相关文件（`*.keystore`、`keystore.properties`）未包含在仓库中，需自行创建。

更详细的适配过程记录见 [doc/开发记录.md](doc/开发记录.md)。

## 致谢与声明

- 原项目：[lyswhut/lx-music-mobile](https://github.com/lyswhut/lx-music-mobile)（Apache-2.0）
- 本项目仅做界面适配，**未修改任何音源逻辑**，音乐数据来自原项目支持的各平台
- 仅供个人学习使用，请支持正版音乐
