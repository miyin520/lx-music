package cn.miyin.music.watch;

import com.reactnativenavigation.NavigationActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class MainActivity extends NavigationActivity {

  @Override
  protected void onCreate(android.os.Bundle savedInstanceState) {
    NativeBootLog.log(this, "MainActivity.onCreate start");
    // 必须在 super.onCreate 之前换主题：窗口属性只在创建时读取一次
    applyFullscreenTheme();
    super.onCreate(savedInstanceState);
    applyNoResize();
    NativeBootLog.log(this, "MainActivity.onCreate done");
  }

  /**
   * 按上次保存的开关选主题：全面屏主题带 android:windowFullscreen，
   * 这样连弹窗（新的 Dialog 窗口）也不会把状态栏带出来。
   */
  private void applyFullscreenTheme() {
    try {
      boolean fullscreen = getSharedPreferences("watch_ui", MODE_PRIVATE).getBoolean("fullscreen", false);
      if (fullscreen) setTheme(cn.miyin.music.watch.R.style.AppTheme_Fullscreen);
    } catch (Throwable ignored) {
    }
  }

  /**
   * 输入法不再改变窗口大小。
   *
   * 清单里虽然写了 adjustNothing，但 react-native-navigation /
   * ReactActivity 在 onCreate 里会重新设置 softInputMode（改成 adjustResize），
   * 于是键盘一出来整个界面被压扁。这里在 super.onCreate 之后强制改回来。
   */
  private void applyNoResize() {
    try {
      getWindow().setSoftInputMode(
        android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING
          | android.view.WindowManager.LayoutParams.SOFT_INPUT_STATE_UNCHANGED
      );
    } catch (Throwable ignored) {
    }
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    // 全面屏开启时，每次重新获得焦点都补一次（系统可能会把状态栏/手势条放回来）
    if (hasFocus) cn.miyin.music.watch.utils.UtilsModule.applyFullscreenIfEnabled(this);
  }

  @Override
  protected void onResume() {
    super.onResume();
    applyNoResize();
    NativeBootLog.log(this, "MainActivity.onResume");
  }
}
