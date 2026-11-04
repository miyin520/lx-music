package cn.miyin.music.watch;

import com.reactnativenavigation.NavigationActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class MainActivity extends NavigationActivity {

  @Override
  protected void onCreate(android.os.Bundle savedInstanceState) {
    NativeBootLog.log(this, "MainActivity.onCreate start");
    super.onCreate(savedInstanceState);
    NativeBootLog.log(this, "MainActivity.onCreate done");
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    // 全面屏开启时，每次重新获得焦点都补一次（系统可能会把状态栏/手势条放回来）
    if (hasFocus) cn.miyin.music.watch.utils.UtilsModule.applyFullscreen(this);
  }

  @Override
  protected void onResume() {
    super.onResume();
    NativeBootLog.log(this, "MainActivity.onResume");
    // 从后台回来 / 新页面进来时补一次全面屏
    cn.miyin.music.watch.utils.UtilsModule.applyFullscreen(this);
  }
}
