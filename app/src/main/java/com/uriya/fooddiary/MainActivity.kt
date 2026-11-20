package com.uriya.fooddiary

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import android.content.ClipboardManager
import android.content.Context
import java.io.File
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject

class MainActivity : ComponentActivity() {

    lateinit var web: WebView
    private lateinit var root: FrameLayout
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    var pendingSave: String? = null
    private var pageReady = false
    private var pendingShared: String? = null

    private val pickLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
            val cb = fileCallback
            fileCallback = null
            cb?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res.resultCode, res.data))
        }

    private fun onSaved(uri: Uri?) {
        val content = pendingSave
        pendingSave = null
        if (uri == null || content == null) return
        try {
            contentResolver.openOutputStream(uri)?.use { it.write(content.toByteArray(Charsets.UTF_8)) }
            js("window.appSaved && window.appSaved(true)")
        } catch (e: Exception) {
            js("window.appSaved && window.appSaved(false)")
        }
    }

    val saveJson = registerForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { onSaved(it) }
    val saveText = registerForActivityResult(ActivityResultContracts.CreateDocument("text/plain")) { onSaved(it) }
    val saveCsv = registerForActivityResult(ActivityResultContracts.CreateDocument("text/csv")) { onSaved(it) }

    // ---------- photo of a written note -> text ----------
    private var photoUri: Uri? = null

    private val takePhoto = registerForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
        val u = photoUri
        if (ok && u != null) ocrFrom(u) else js("window.onOcrText && window.onOcrText(null, 'cancel')")
    }
    private val pickPhoto = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) ocrFrom(uri) else js("window.onOcrText && window.onOcrText(null, 'cancel')")
    }

    fun ocrCamera() {
        runOnUiThread {
            try {
                val dir = File(cacheDir, "ocr").apply { mkdirs() }
                val f = File(dir, "note.jpg")
                val u = FileProvider.getUriForFile(this, "$packageName.files", f)
                photoUri = u
                takePhoto.launch(u)
            } catch (e: Exception) {
                js("window.onOcrText && window.onOcrText(null, 'nocamera')")
            }
        }
    }

    fun ocrGallery() {
        runOnUiThread {
            try { pickPhoto.launch("image/*") } catch (e: Exception) { js("window.onOcrText && window.onOcrText(null, 'error')") }
        }
    }

    private fun ocrFrom(uri: Uri) {
        js("window.onOcrStart && window.onOcrStart()")
        Thread {
            val result = try {
                val bmp = Ocr.loadBitmap(this, uri)
                if (bmp == null) null else Ocr.recognize(this, bmp)
            } catch (e: Throwable) { null }
            if (result == null) js("window.onOcrText && window.onOcrText(null, 'error')")
            else js("window.onOcrText && window.onOcrText(" + JSONObject.quote(result) + ", 'ok')")
        }.start()
    }

    fun openLens(): Boolean {
        val tries = listOf(
            Intent(Intent.ACTION_VIEW, Uri.parse("googleapp://lens")).setPackage("com.google.android.googlequicksearchbox"),
            packageManager.getLaunchIntentForPackage("com.google.ar.lens"),
            Intent(Intent.ACTION_VIEW, Uri.parse("google://lens")).setPackage("com.google.android.googlequicksearchbox")
        )
        for (i in tries) {
            if (i == null) continue
            try {
                startActivity(i)
                return true
            } catch (_: Exception) { }
        }
        return false
    }

    fun readClipboard(): String {
        return try {
            val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = cm.primaryClip
            if (clip != null && clip.itemCount > 0) clip.getItemAt(0).coerceToText(this)?.toString() ?: "" else ""
        } catch (_: Exception) { "" }
    }

    val notifPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            js("window.onNotifPermission && window.onNotifPermission($granted)")
        }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        root = FrameLayout(this)
        root.setBackgroundColor(Color.parseColor("#F5F6F2"))
        web = WebView(this)
        root.addView(web, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        setContentView(root)

        // The web page draws behind the system bars; tell it how much space they take.
        ViewCompat.setOnApplyWindowInsetsListener(root) { _, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
            val d = resources.displayMetrics.density
            val top = (bars.top / d).toInt()
            val bottom = (maxOf(bars.bottom, ime.bottom) / d).toInt()
            val imeOpen = ime.bottom > bars.bottom
            web.setPadding(0, 0, 0, 0)
            val lp = web.layoutParams as FrameLayout.LayoutParams
            lp.bottomMargin = if (imeOpen) ime.bottom else 0
            web.layoutParams = lp
            insetsJs = "window.setInsets && window.setInsets($top, ${if (imeOpen) 0 else bottom})"
            if (pageReady) js(insetsJs!!)
            WindowInsetsCompat.CONSUMED
        }

        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = false
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = true
            textZoom = 100
        }
        web.setBackgroundColor(Color.TRANSPARENT)
        web.addJavascriptInterface(Bridge(this), "Android")

        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                loader.shouldInterceptRequest(request.url)

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url
                if (url.host == "appassets.androidplatform.net") return false
                try {
                    startActivity(Intent(Intent.ACTION_VIEW, url))
                } catch (_: Exception) { }
                return true
            }

            override fun onPageFinished(view: WebView, url: String) {
                pageReady = true
                insetsJs?.let { js(it) }
                pendingShared?.let { deliverShared(it) }
                pendingShared = null
            }
        }

        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView,
                filePathCallback: ValueCallback<Array<Uri>>,
                fileChooserParams: FileChooserParams
            ): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = filePathCallback
                return try {
                    pickLauncher.launch(fileChooserParams.createIntent())
                    true
                } catch (e: Exception) {
                    fileCallback = null
                    false
                }
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("(window.appBack ? window.appBack() : false)") { r ->
                    if (r != "true") {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                        isEnabled = true
                    }
                }
            }
        })

        handleShareIntent(intent)
        if (savedInstanceState != null) web.restoreState(savedInstanceState)
        else web.loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
    }

    private var insetsJs: String? = null

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleShareIntent(intent)
    }

    override fun onPause() {
        if (::web.isInitialized) {
            web.evaluateJavascript("window.appPause && window.appPause()", null)
            web.onPause() // stops animated backgrounds while the app is in the background
        }
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        if (::web.isInitialized) web.onResume()
    }

    private fun handleShareIntent(intent: Intent?) {
        if (intent?.action == Intent.ACTION_SEND && intent.type == "text/plain") {
            val text = intent.getStringExtra(Intent.EXTRA_TEXT) ?: return
            if (pageReady) deliverShared(text) else pendingShared = text
        }
    }

    private fun deliverShared(text: String) {
        js("window.onSharedText && window.onSharedText(" + JSONObject.quote(text) + ")")
    }

    fun js(code: String) {
        runOnUiThread { if (::web.isInitialized) web.evaluateJavascript(code, null) }
    }

    fun setBars(bg: String, dark: Boolean) {
        runOnUiThread {
            try { root.setBackgroundColor(Color.parseColor(bg)) } catch (_: Exception) { }
            val c = WindowInsetsControllerCompat(window, root)
            c.isAppearanceLightStatusBars = !dark
            c.isAppearanceLightNavigationBars = !dark
        }
    }

    fun hasNotifPermission(): Boolean =
        Build.VERSION.SDK_INT < 33 ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

    fun askNotifPermission() {
        runOnUiThread {
            if (hasNotifPermission()) js("window.onNotifPermission && window.onNotifPermission(true)")
            else notifPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }
}
