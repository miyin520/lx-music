import { memo } from 'react'
import { View, TouchableWithoutFeedback } from 'react-native'

// import Title from './components/Title'
import MoreBtn from './components/MoreBtn'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { createStyle } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { isWatch } from '@/utils/watchMode'


export default memo(({ onPressLyricZone }: { onPressLyricZone?: () => void }) => {
  return (
    <View style={styles.container} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}>
      <PlayInfo />
      <ControlBtn />
      <MoreBtn />
      {
        // 表盘上控件密、容易误触：在进度条那一带留一条「点击切到歌词」的感应区
        isWatch() && onPressLyricZone
          ? <TouchableWithoutFeedback onPress={onPressLyricZone}>
              <View style={styles.lyricTapZone} />
            </TouchableWithoutFeedback>
          : null
      }
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 0,
    width: '100%',
    // paddingTop: progressContentPadding,
    // marginTop: -progressContentPadding,
    // backgroundColor: 'rgba(0, 0, 0, .1)',
    // 表盘下缘是圆的：底部留白加大，控制键才不会被切掉
    paddingHorizontal: isWatch() ? 26 : 15,
    paddingBottom: isWatch() ? 56 : 15,
    paddingTop: 5,
    // backgroundColor: AppColors.primary,
    // backgroundColor: 'red',
    flexDirection: 'column',
  },
  lyricTapZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    // 盖在进度条那一带，避开下面的大按钮
    bottom: 10,
    height: 40,
    // backgroundColor: 'rgba(0,0,0,0.05)',
  },
  status: {
    marginTop: 10,
    flexDirection: 'column',
    flex: 0,
    paddingLeft: 5,
    justifyContent: 'space-evenly',
    // backgroundColor: 'rgba(0, 0, 0, .1)',
  },
})
