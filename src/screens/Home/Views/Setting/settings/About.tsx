import { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'

import Section from '../components/Section'
// import Button from './components/Button'

import { createStyle, openUrl, clipboardWriteText } from '@/utils/tools'
// import { showPactModal } from '@/navigation'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'

// const qqGroupUrl = 'mqqopensdkapi://bizAgent/qm/qr?url=http%3A%2F%2Fqm.qq.com%2Fcgi-bin%2Fqm%2Fqr%3Ffrom%3Dapp%26p%3Dandroid%26jump_from%3Dwebapi%26k%3Du1zyxek8roQAwic44nOkBXtG9CfbAxFw'
// const qqGroupUrl2 = 'mqqopensdkapi://bizAgent/qm/qr?url=http%3A%2F%2Fqm.qq.com%2Fcgi-bin%2Fqm%2Fqr%3Ffrom%3Dapp%26p%3Dandroid%26jump_from%3Dwebapi%26k%3D-l4kNZ2bPQAuvfCQFFhl1UoibvF5wcrQ'
// const qqGroupWebUrl = 'https://qm.qq.com/cgi-bin/qm/qr?k=jRZkyFSZ4FmUuTHA3P_RAXbbUO_Rrn5e&jump_from=webapi'
// const qqGroupWebUrl2 = 'https://qm.qq.com/cgi-bin/qm/qr?k=HPNJEfrZpBZ9T8szYWbe2d5JrAAeOt_l&jump_from=webapi'

/** 交流群号，改号只需改这里 */
const QQ_GROUP = '439155836'

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const openWatchRepoPage = () => {
    void openUrl('https://github.com/miyin520/lx-music')
  }

  const openHomePage = () => {
    void openUrl('https://github.com/lyswhut/lx-music-mobile#readme')
  }
  const openGHReleasePage = () => {
    void openUrl('https://github.com/miyin520/lx-music/releases')
  }
  // const openIssuesPage = () => {
  //   openUrl('https://github.com/lyswhut/lx-music-mobile/issues')
  // }

  // const goToQQGroup = () => {
  //   openUrl(qqGroupUrl).catch(() => {
  //     void openUrl(qqGroupWebUrl)
  //   })
  // }
  // const goToQQGroup2 = () => {
  //   openUrl(qqGroupUrl2).catch(() => {
  //     void openUrl(qqGroupWebUrl2)
  //   })
  // }

  const textLinkStyle = {
    ...styles.text,
    textDecorationLine: 'underline',
    color: theme['c-primary-font'],
    // fontSize: 14,
  } as const


  return (
    <Section title={t('setting_about')}>
      <View style={styles.part}>
        <Text style={styles.text}>LX Music 移动版的手表适配版本，开源地址：</Text>
        <TouchableOpacity onPress={openWatchRepoPage}>
          <Text style={textLinkStyle}>github.com/miyin520/lx-music</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>反馈群：QQ {QQ_GROUP}（点击复制）</Text>
        <TouchableOpacity onPress={() => { clipboardWriteText(QQ_GROUP) }}>
          <Text style={textLinkStyle}>{QQ_GROUP}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>原项目：</Text>
        <TouchableOpacity onPress={openHomePage}>
          <Text style={textLinkStyle}>github.com/lyswhut/lx-music-mobile</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>新版下载：</Text>
        <TouchableOpacity onPress={openGHReleasePage}>
          <Text style={textLinkStyle}>本项目 Releases</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>By: 落雪无痕 / miyin</Text>
      </View>
    </Section>
  )
})

const styles = createStyle({
  part: {
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  text: {
    fontSize: 14,
    textAlignVertical: 'bottom',
  },
  boldText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlignVertical: 'bottom',
  },
  throughText: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    textAlignVertical: 'bottom',
  },
  btn: {
    flexDirection: 'row',
  },
})
