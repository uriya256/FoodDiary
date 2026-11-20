package com.uriya.fooddiary

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/**
 * Rest timer between sets. Runs in the app process, so it still buzzes when the screen is off
 * or the app is in the background for a minute or two; then it also shows a notification.
 */
object RestTimer {
    private const val CHANNEL = "rest_timer"
    private const val NOTIF_ID = 21
    private val handler = Handler(Looper.getMainLooper())
    private var pending: Runnable? = null
    @Volatile var appVisible = true

    fun start(ctx: Context, seconds: Int, title: String, text: String) {
        cancel(ctx)
        val app = ctx.applicationContext
        val r = Runnable {
            pending = null
            vibrate(app, true)
            if (!appVisible) notify(app, title, text)
        }
        pending = r
        handler.postDelayed(r, seconds.coerceIn(5, 900) * 1000L)
    }

    fun cancel(ctx: Context) {
        pending?.let { handler.removeCallbacks(it) }
        pending = null
        try { NotificationManagerCompat.from(ctx).cancel(NOTIF_ID) } catch (_: Exception) { }
    }

    fun vibrate(ctx: Context, long: Boolean) {
        try {
            val v: Vibrator = if (Build.VERSION.SDK_INT >= 31) {
                (ctx.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                ctx.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }
            if (!v.hasVibrator()) return
            val pattern = if (long) longArrayOf(0, 350, 150, 350, 150, 500) else longArrayOf(0, 40)
            v.vibrate(VibrationEffect.createWaveform(pattern, -1))
        } catch (_: Exception) { }
    }

    private fun notify(ctx: Context, title: String, text: String) {
        val en = ctx.getSharedPreferences("diary", Context.MODE_PRIVATE).getString("lang", "he") == "en"
        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= 26) {
            nm.createNotificationChannel(
                NotificationChannel(CHANNEL, if (en) "Rest timer" else "טיימר מנוחה", NotificationManager.IMPORTANCE_HIGH)
            )
        }
        val open = PendingIntent.getActivity(
            ctx, 22, Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val n = NotificationCompat.Builder(ctx, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_food)
            .setContentTitle(title)
            .setContentText(text)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setContentIntent(open)
            .setAutoCancel(true)
            .setTimeoutAfter(5 * 60 * 1000L)
            .build()
        try { NotificationManagerCompat.from(ctx).notify(NOTIF_ID, n) } catch (_: SecurityException) { }
    }
}
