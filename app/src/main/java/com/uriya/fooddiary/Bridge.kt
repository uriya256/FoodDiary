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
                toast("לא הצלחתי לפתוח את חלון השמירה")
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
            try { act.startActivity(Intent.createChooser(send, "שיתוף")) } catch (_: Exception) { }
        }
    }

    @JavascriptInterface
    fun toast(msg: String) {
        act.runOnUiThread { Toast.makeText(act, msg, Toast.LENGTH_SHORT).show() }
    }

    @JavascriptInterface
    fun setBars(bg: String, dark: Boolean) = act.setBars(bg, dark)

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
