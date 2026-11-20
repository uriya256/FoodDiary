package com.uriya.fooddiary

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

/**
 * Water reminders that only fire when you are behind an even pace between waking up and bedtime.
 * The notification has a "drank a glass" button that logs a glass without opening the app.
 */
object WaterReminders {
    private const val CHANNEL = "water"
    private const val NOTIF_ID = 11
    const val ACTION_CHECK = "com.uriya.fooddiary.WATER_CHECK"
    const val ACTION_ADD = "com.uriya.fooddiary.WATER_ADD"

    private fun prefs(ctx: Context) = ctx.getSharedPreferences("diary", Context.MODE_PRIVATE)

    fun schedule(ctx: Context) {
        val p = prefs(ctx)
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pi = PendingIntent.getBroadcast(
            ctx, 5, Intent(ctx, WaterReceiver::class.java).setAction(ACTION_CHECK),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        am.cancel(pi)
        if (!p.getBoolean("wr_on", false)) return

        val wake = p.getInt("wr_wake", 7 * 60)
        val sleep = p.getInt("wr_sleep", 23 * 60)
        val every = p.getInt("wr_every", 120).coerceIn(30, 360)

        val now = Calendar.getInstance()
        val nowMin = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
        val next = Calendar.getInstance().apply { set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0) }
        val first = wake + 90 // first check about an hour and a half after waking up
        when {
            nowMin < first -> setMin(next, first)
            nowMin + every <= sleep -> setMin(next, nowMin + every)
            else -> { next.add(Calendar.DAY_OF_YEAR, 1); setMin(next, first) }
        }
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.timeInMillis, pi)
    }

    private fun setMin(c: Calendar, min: Int) {
        c.set(Calendar.HOUR_OF_DAY, (min / 60).coerceIn(0, 23))
        c.set(Calendar.MINUTE, min % 60)
    }

    private fun today() = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Calendar.getInstance().time)
    private fun nowHHMM() = SimpleDateFormat("HH:mm", Locale.US).format(Calendar.getInstance().time)

    private fun litres(ml: Int): String {
        val l = Math.round(ml / 10.0) / 100.0
        return if (l == Math.floor(l)) l.toInt().toString() else l.toString()
    }

    fun check(ctx: Context) {
        val p = prefs(ctx)
        if (!p.getBoolean("wr_on", false)) return
        val en = p.getString("lang", "he") == "en"
        val goal = p.getInt("w_goal", 2500)
        val cup = p.getInt("w_cup", 250)
        val ml = if (p.getString("w_date", "") == today()) p.getInt("w_ml", 0) else 0
        if (ml >= goal) return
        val wake = p.getInt("wr_wake", 7 * 60)
        val sleep = p.getInt("wr_sleep", 23 * 60)
        val c = Calendar.getInstance()
        val nowMin = c.get(Calendar.HOUR_OF_DAY) * 60 + c.get(Calendar.MINUTE)
        if (nowMin < wake || nowMin > sleep) return
        val frac = ((nowMin - wake).toDouble() / maxOf(60, sleep - wake)).coerceIn(0.0, 1.0)
        val expected = (goal * frac).toInt()
        if (expected - ml <= maxOf(150, (cup * 0.6).toInt())) return

        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= 26) {
            nm.createNotificationChannel(
                NotificationChannel(CHANNEL, if (en) "Water" else "מים", NotificationManager.IMPORTANCE_DEFAULT)
            )
        }
        val open = PendingIntent.getActivity(
            ctx, 7, Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val add = PendingIntent.getBroadcast(
            ctx, 6, Intent(ctx, WaterReceiver::class.java).setAction(ACTION_ADD),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val title = if (en) "Time for some water" else "הגיע הזמן לשתות"
        val text = if (en) "You've had ${litres(ml)} of ${litres(goal)} L. By now you'd be at about ${litres(expected)} L."
        else "שתית ${litres(ml)} מתוך ${litres(goal)} ליטר. לפי השעה כדאי להיות בערך ב-${litres(expected)}."
        val n = NotificationCompat.Builder(ctx, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_food)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setContentIntent(open)
            .addAction(0, if (en) "I drank a glass ($cup ml)" else "שתיתי כוס ($cup מ\"ל)", add)
            .setAutoCancel(true)
            .build()
        try { NotificationManagerCompat.from(ctx).notify(NOTIF_ID, n) } catch (_: SecurityException) { }
    }

    /** Called from the notification button: remember the glass until the app opens. */
    fun addGlass(ctx: Context) {
        val p = prefs(ctx)
        val cup = p.getInt("w_cup", 250)
        val t = today()
        val list = try { JSONArray(p.getString("w_pending", "[]")) } catch (_: Exception) { JSONArray() }
        list.put(JSONObject().put("d", t).put("t", nowHHMM()).put("ml", cup))
        val ml = (if (p.getString("w_date", "") == t) p.getInt("w_ml", 0) else 0) + cup
        p.edit().putString("w_pending", list.toString()).putString("w_date", t).putInt("w_ml", ml).apply()
        NotificationManagerCompat.from(ctx).cancel(NOTIF_ID)
    }

    fun takePending(ctx: Context): String {
        val p = prefs(ctx)
        val s = p.getString("w_pending", "[]") ?: "[]"
        p.edit().putString("w_pending", "[]").apply()
        return s
    }
}

class WaterReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        when (intent.action) {
            WaterReminders.ACTION_ADD -> WaterReminders.addGlass(ctx)
            else -> {
                WaterReminders.check(ctx)
                WaterReminders.schedule(ctx)
            }
        }
    }
}
