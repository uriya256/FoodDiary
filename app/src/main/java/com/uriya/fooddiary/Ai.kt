package com.uriya.fooddiary

import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.SocketTimeoutException
import java.net.URL
import java.util.concurrent.ConcurrentHashMap

/** Talks to Google Gemini for the in-app chat. Runs on background threads and streams the answer to the page. */
object Ai {
    private const val BASE = "https://generativelanguage.googleapis.com/v1beta/"
    private val running = ConcurrentHashMap<String, HttpURLConnection>()
    private val SAFE_MODEL = Regex("^[A-Za-z0-9._-]{3,80}$")
    private val SAFE_PATH = Regex("^models(\\?[A-Za-z0-9=&_-]*)?$")

    private fun q(s: String) = JSONObject.quote(s)

    private fun enc(s: String) = java.net.URLEncoder.encode(s, "UTF-8")

    /** Whether the phone has a network that reaches the internet right now. */
    private fun online(act: MainActivity): Boolean = try {
        val cm = act.getSystemService(ConnectivityManager::class.java)
        val caps = cm?.getNetworkCapabilities(cm.activeNetwork)
        caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    } catch (_: Exception) { true }

    /** Error codes for failures without an HTTP answer: 0 no internet, -1 the connection dropped, -2 Google didn't answer in time. */
    private fun failCode(act: MainActivity, e: Exception) = when {
        e is SocketTimeoutException -> -2
        !online(act) -> 0
        else -> -1
    }

    fun stream(act: MainActivity, id: String, model: String, key: String, body: String) {
        if (!SAFE_MODEL.matches(model)) { act.js("window.onAiError && window.onAiError(${q(id)}, 404, 'bad model')"); return }
        Thread {
            var conn: HttpURLConnection? = null
            try {
                // The key goes in the x-goog-api-key header; if Google refuses that, try once with ?key= (works for both "AQ." and "AIza" keys)
                for (attempt in 0..1) {
                    val viaQuery = attempt == 1
                    conn = (URL("${BASE}models/$model:streamGenerateContent?alt=sse" + (if (viaQuery) "&key=" + enc(key) else "")).openConnection() as HttpURLConnection).apply {
                        requestMethod = "POST"
                        doOutput = true
                        connectTimeout = 20000
                        readTimeout = 90000
                        setRequestProperty("Content-Type", "application/json; charset=utf-8")
                        if (!viaQuery) setRequestProperty("x-goog-api-key", key)
                    }
                    running[id] = conn!!
                    conn!!.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
                    val code = conn!!.responseCode
                    if (code !in 200..299) {
                        val err = try { conn!!.errorStream?.bufferedReader(Charsets.UTF_8)?.readText() ?: "" } catch (_: Exception) { "" }
                        if (!viaQuery && (code == 401 || code == 403) && running.containsKey(id)) { conn!!.disconnect(); continue }
                        act.js("window.onAiError && window.onAiError(${q(id)}, $code, ${q(err.take(2000))})")
                    } else {
                        conn!!.inputStream.bufferedReader(Charsets.UTF_8).use { r ->
                            while (true) {
                                val line = r.readLine() ?: break
                                if (line.startsWith("data:")) act.js("window.onAiChunk && window.onAiChunk(${q(id)}, ${q(line.substring(5).trim())})")
                            }
                        }
                        act.js("window.onAiDone && window.onAiDone(${q(id)})")
                    }
                    break
                }
            } catch (e: Exception) {
                if (running.containsKey(id)) act.js("window.onAiError && window.onAiError(${q(id)}, ${failCode(act, e)}, ${q(e.toString())})")
            } finally {
                running.remove(id)
                conn?.disconnect()
            }
        }.start()
    }

    fun get(act: MainActivity, id: String, path: String, key: String) {
        if (!SAFE_PATH.matches(path)) { act.js("window.onAiHttp && window.onAiHttp(${q(id)}, 400, '')"); return }
        Thread {
            var code = 0
            var text = ""
            try {
                for (attempt in 0..1) {
                    val viaQuery = attempt == 1
                    val url = BASE + path + (if (viaQuery) (if (path.contains("?")) "&" else "?") + "key=" + enc(key) else "")
                    val conn = (URL(url).openConnection() as HttpURLConnection).apply {
                        connectTimeout = 20000
                        readTimeout = 30000
                        if (!viaQuery) setRequestProperty("x-goog-api-key", key)
                    }
                    try {
                        code = conn.responseCode
                        text = try {
                            (if (code in 200..299) conn.inputStream else conn.errorStream)?.bufferedReader(Charsets.UTF_8)?.readText() ?: ""
                        } catch (_: Exception) { "" }
                    } finally { conn.disconnect() }
                    if (viaQuery || (code != 401 && code != 403)) break
                }
                act.js("window.onAiHttp && window.onAiHttp(${q(id)}, $code, ${q(text)})")
            } catch (e: Exception) {
                act.js("window.onAiHttp && window.onAiHttp(${q(id)}, ${failCode(act, e)}, ${q(e.toString())})")
            }
        }.start()
    }

    fun cancel(id: String) {
        running.remove(id)?.let { c -> Thread { try { c.disconnect() } catch (_: Exception) { } }.start() }
    }
}
