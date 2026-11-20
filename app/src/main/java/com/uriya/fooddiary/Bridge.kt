package com.uriya.fooddiary

import android.content.Context
import android.content.Intent
import android.webkit.JavascriptInterface
import android.widget.Toast
import java.io.File

/** Methods the web page can call as window.Android.xxx(...) */
class Bridge(private val act: MainActivity) {

    private val prefs = act.getSharedPreferences("diary", Context.MODE_PRIVATE)

    @JavascriptInterface
    fun isApp(): Boolean = true

    private fun en() = prefs.getString("lang", "he") == "en"

    /** "he" or "en": used for notification texts and system dialogs. */
    @JavascriptInterface
    fun setLang(lang: String) {
        prefs.edit().putString("lang", lang).apply()
    }

    @JavascriptInterface
    fun appVersion(): String = try {
        act.packageManager.getPackageInfo(act.packageName, 0).versionName ?: ""
    } catch (_: Exception) { "" }

    /** kind: json | text | csv */
    @JavascriptInterface
    fun saveFile(name: String, content: String, kind: String) {
        act.runOnUiThread {
            act.pendingSave = content
            try {
                when (kind) {
                    "json" -> act.saveJson.launch(name)
                    "csv" -> act.saveCsv.launch(name)
                    else -> act.saveText.launch(name)
                }
            } catch (e: Exception) {
                act.pendingSave = null
                toast(if (en()) "Couldn't open the save dialog" else "לא הצלחתי לפתוח את חלון השמירה")
            }
        }
    }

    @JavascriptInterface
    fun shareText(text: String) {
        act.runOnUiThread {
            val send = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, text)
            }
            try { act.startActivity(Intent.createChooser(send, if (en()) "Share" else "שיתוף")) } catch (_: Exception) { }
        }
    }

    @JavascriptInterface
    fun toast(msg: String) {
        act.runOnUiThread { Toast.makeText(act, msg, Toast.LENGTH_SHORT).show() }
    }

    @JavascriptInterface
    fun setBars(bg: String, dark: Boolean) = act.setBars(bg, dark)

    // ---------- reading a written note ----------
    @JavascriptInterface
    fun ocrCamera() = act.ocrCamera()

    @JavascriptInterface
    fun ocrGallery() = act.ocrGallery()

    @JavascriptInterface
    fun openLens(): Boolean {
        var ok = false
        val latch = java.util.concurrent.CountDownLatch(1)
        act.runOnUiThread { ok = act.openLens(); latch.countDown() }
        latch.await(3, java.util.concurrent.TimeUnit.SECONDS)
        return ok
    }

    @JavascriptInterface
    fun readClipboard(): String {
        var text = ""
        val latch = java.util.concurrent.CountDownLatch(1)
        act.runOnUiThread { text = act.readClipboard(); latch.countDown() }
        latch.await(3, java.util.concurrent.TimeUnit.SECONDS)
        return text
    }

    // ---------- reminders ----------
    @JavascriptInterface
    fun setReminder(enabled: Boolean, hour: Int, minute: Int) {
        prefs.edit()
            .putBoolean("rem_on", enabled)
            .putInt("rem_h", hour)
            .putInt("rem_m", minute)
            .apply()
        Reminders.schedule(act)
    }

    /** How many meals were logged on a date (yyyy-mm-dd); the reminder skips full days. */
    @JavascriptInterface
    fun setDayStatus(date: String, meals: Int) {
        prefs.edit().putString("status_date", date).putInt("status_meals", meals).apply()
    }

    // ---------- water ----------
    @JavascriptInterface
    fun setWaterStatus(date: String, ml: Int, goal: Int, cup: Int) {
        prefs.edit().putString("w_date", date).putInt("w_ml", ml).putInt("w_goal", goal).putInt("w_cup", cup).apply()
    }

    @JavascriptInterface
    fun setWaterReminder(on: Boolean, wakeMin: Int, sleepMin: Int, everyMin: Int) {
        prefs.edit().putBoolean("wr_on", on).putInt("wr_wake", wakeMin).putInt("wr_sleep", sleepMin).putInt("wr_every", everyMin).apply()
        WaterReminders.schedule(act)
    }

    @JavascriptInterface
    fun takePendingWater(): String = WaterReminders.takePending(act)

    @JavascriptInterface
    fun hasNotificationPermission(): Boolean = act.hasNotifPermission()

    @JavascriptInterface
    fun requestNotificationPermission() = act.askNotifPermission()

    // ---------- automatic backup to the app's private storage ----------
    @JavascriptInterface
    fun autoBackup(json: String) {
        Thread {
            try {
                val dir = act.filesDir
                val tmp = File(dir, "backup.tmp")
                tmp.writeText(json, Charsets.UTF_8)
                val main = File(dir, "backup.json")
                if (main.exists()) main.copyTo(File(dir, "backup.prev.json"), overwrite = true)
                tmp.renameTo(main)
            } catch (_: Exception) { }
        }.start()
    }

    @JavascriptInterface
    fun readAutoBackup(): String {
        return try {
            val f = File(act.filesDir, "backup.json")
            if (f.exists()) f.readText(Charsets.UTF_8) else ""
        } catch (_: Exception) { "" }
    }
}
