package cn.miyin.music.watch;

import android.content.Context;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Java 层的启动打点
 *
 * JS 层的日志要等 React 实例起来才会写，如果进程在 JS 启动前就崩了，
 * 日志里连一行都不会留下（用户反馈过"点开直接闪退，日志都没有"）。
 * 这里直接往 JS 用的同一个日志文件里追加，保证任何阶段崩溃都能留下痕迹。
 */
public final class NativeBootLog {

  private NativeBootLog() {}

  public static void log(Context context, String message) {
    if (context == null) return;
    File file = new File(context.getCacheDir(), "error.log");
    String time = new SimpleDateFormat("yyyy/M/d a h:mm:ss", Locale.CHINA).format(new Date());
    try (FileWriter writer = new FileWriter(file, true)) {
      writer.write("\n----lx log----\n" + time + " NATIVE " + message + "\n");
    } catch (IOException ignored) {
    }
  }
}
