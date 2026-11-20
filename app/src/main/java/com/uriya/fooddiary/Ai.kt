package com.uriya.fooddiary

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.ConcurrentHashMap

/** Talks to Google Gemini for the in-app chat. Runs on background threads and streams the answer to the page. */
object Ai {
    private const val BASE = "https://generativelanguage.googleapis.com/v1beta/"
    private val running = ConcurrentHashMap<String, HttpURLConnection>()
    private val SAFE_MODEL = Regex("^[A-Za-z0-9._-]{3,80}$")
    private val SAFE_PATH = Regex("^models(\\?[A-Za-z0-9=&_-]*)?$")

    private fun q(s: String) = JSONObject.quote(s)

    fun stream(act: MainActivity, id: String, model: String, key: String, body: String) {
        if (!SAFE_MODEL.matches(model)) { act.js("window.onAiError && window.onAiError(${q(id)}, 404, 'bad model')"); return }
        Thread {
            var conn: HttpURLConnection? = null
            try {
                conn = (URL("${BASE}models/$model:streamGenerateContent?alt=sse").openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    doOutput = true
                    connectTimeout = 20000
                    readTimeout = 120000
                    setRequestProperty("Content-Type", "application/json; charset=utf-8")
                    setRequestProperty("x-goog-api-key", key)
                }
                running[id] = conn
                conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
                val code = conn.responseCode
                if (code !in 200..299) {
                    val err = try { conn.errorStream?.bufferedReader(Charsets.UTF_8)?.readText() ?: "" } catch (_: Exception) { "" }
                    act.js("window.onAiError && window.onAiError(${q(id)}, $code, ${q(err.take(2000))})")
                } else {
                    conn.inputStream.bufferedReader(Charsets.UTF_8).use { r ->
                        while (true) {
                            val line = r.readLine() ?: break
                            if (line.startsWith("data:")) act.js("window.onAiChunk && window.onAiChunk(${q(id)}, ${q(line.substring(5).trim())})")
                        }
                    }
                    act.js("window.onAiDone && window.onAiDone(${q(id)})")
                }
            } catch (e: Exception) {
                if (running.containsKey(id)) act.js("window.onAiError && window.onAiError(${q(id)}, 0, ${q(e.toString())})")
            } finally {
                running.remove(id)
                conn?.disconnect()
            }
        }.start()
    }

    fun get(act: MainActivity, id: String, path: String, key: String) {
        if (!SAFE_PATH.matches(path)) { act.js("window.onAiHttp && window.onAiHttp(${q(id)}, 400, '')"); return }
        Thread {
            var conn: HttpURLConnection? = null
            try {
                conn = (URL(BASE + path).openConnection() as HttpURLConnection).apply {
                    connectTimeout = 20000
                    readTimeout = 30000
                    setRequestProperty("x-goog-api-key", key)
                }
                val code = conn.responseCode
                val text = try {
                    (if (code in 200..299) conn.inputStream else conn.errorStream)?.bufferedReader(Charsets.UTF_8)?.readText() ?: ""
                } catch (_: Exception) { "" }
                act.js("window.onAiHttp && window.onAiHttp(${q(id)}, $code, ${q(text)})")
            } catch (e: Exception) {
                act.js("window.onAiHttp && window.onAiHttp(${q(id)}, 0, ${q(e.toString())})")
            } finally {
                conn?.disconnect()
            }
        }.start()
    }

    fun cancel(id: String) {
        running.remove(id)?.let { c -> Thread { try { c.disconnect() } catch (_: Exception) { } }.start() }
    }
}
