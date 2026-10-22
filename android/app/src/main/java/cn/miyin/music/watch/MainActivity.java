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
  protected void onResume() {
    super.onResume();
    NativeBootLog.log(this, "MainActivity.onResume");
  }
}
