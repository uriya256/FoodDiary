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
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import android.view.Gravity
import android.text.TextUtils
import android.graphics.drawable.GradientDrawable
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import android.content.ClipboardManager
import android.content.ClipData
import android.content.ActivityNotFoundException
import android.content.Context
import java.io.File
import java.io.ByteArrayOutputStream
import android.util.Base64
import android.graphics.Bitmap
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
    private var photoMode = "ocr" // "ocr" = read it here offline, "lens" = send the photo to Google Lens, "label" = a nutrition label
    private var labelUri: Uri? = null
    /** Who hears about a cancelled or failed photo. */
    private fun photoCb() = if (photoMode == "label") "onLabelPhoto" else "onOcrText"

    private val takePhoto = registerForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
        val u = photoUri
        if (ok && u != null) gotPhoto(u) else js("window.${photoCb()} && window.${photoCb()}(null, 'cancel')")
    }
    private val pickPhoto = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) gotPhoto(uri) else js("window.${photoCb()} && window.${photoCb()}(null, 'cancel')")
    }

    private fun gotPhoto(uri: Uri) {
        when (photoMode) {
            "lens" -> sendToLens(uri)
            "label" -> labelPhoto(uri)
            else -> ocrFrom(uri)
        }
    }

    private fun newPhotoUri(): Uri {
        val dir = File(cacheDir, "ocr").apply { mkdirs() }
        val f = File(dir, "note-${System.currentTimeMillis()}.jpg")
        dir.listFiles()?.filter { it.name != f.name && System.currentTimeMillis() - it.lastModified() > 3600_000 }?.forEach { it.delete() }
        return FileProvider.getUriForFile(this, "$packageName.files", f)
    }

    /** mode: "ocr" or "lens"; source: "camera" or "gallery" */
    fun photo(mode: String, source: String) {
        runOnUiThread {
            photoMode = mode
            try {
                if (source == "gallery") pickPhoto.launch("image/*")
                else { val u = newPhotoUri(); photoUri = u; takePhoto.launch(u) }
            } catch (e: Exception) {
                js("window.${photoCb()} && window.${photoCb()}(null, 'nocamera', " + JSONObject.quote(e.toString()) + ")")
            }
        }
    }

    /** A photo of a nutrition label: the page gets it as a JPEG (for Gemini) and can ask for it to be read here (labelOcr). */
    private fun labelPhoto(uri: Uri) {
        labelUri = uri
        Thread {
            val b64 = try {
                val bmp = Ocr.loadBitmap(this, uri, 1600)
                if (bmp == null) null else {
                    val out = ByteArrayOutputStream()
                    bmp.compress(Bitmap.CompressFormat.JPEG, 85, out)
                    Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
                }
            } catch (e: Throwable) { null }
            if (b64 == null) js("window.onLabelPhoto && window.onLabelPhoto(null, 'error', 'image')")
            else js("window.onLabelPhoto && window.onLabelPhoto(" + JSONObject.quote(b64) + ", 'ok')")
        }.start()
    }

    /**
     * Reads the last label photo offline; the text goes to window.onLabelText.
     * mode "block" reads it as one block of rows (keeps a table's name and number on one line), "auto" lets the reader find columns.
     */
    fun labelOcr(mode: String) {
        val psm = if (mode == "auto") com.googlecode.tesseract.android.TessBaseAPI.PageSegMode.PSM_AUTO
                  else com.googlecode.tesseract.android.TessBaseAPI.PageSegMode.PSM_SINGLE_BLOCK
        val uri = labelUri
        if (uri == null) { js("window.onLabelText && window.onLabelText(null, 'error', 'image')"); return }
        Thread {
            var err: String? = null
            val result = try {
                val bmp = Ocr.loadBitmap(this, uri)
                if (bmp == null) { err = "image"; null } else Ocr.recognize(this, bmp, psm).also { if (it == null) err = "data" }
            } catch (e: Throwable) { err = e.toString(); null }
            if (result == null) js("window.onLabelText && window.onLabelText(null, 'error', " + JSONObject.quote(err ?: "") + ")")
            else js("window.onLabelText && window.onLabelText(" + JSONObject.quote(result) + ", 'ok', " + JSONObject.quote(mode) + ")")
        }.start()
    }

    fun ocrCamera() = photo("ocr", "camera")
    fun ocrGallery() = photo("ocr", "gallery")

    private fun ocrFrom(uri: Uri) {
        js("window.onOcrStart && window.onOcrStart()")
        Thread {
            var err: String? = null
            val result = try {
                val bmp = Ocr.loadBitmap(this, uri)
                if (bmp == null) { err = "image"; null } else Ocr.recognize(this, bmp).also { if (it == null) err = "data" }
            } catch (e: Throwable) { err = e.toString(); null }
            if (result == null) js("window.onOcrText && window.onOcrText(null, 'error', " + JSONObject.quote(err ?: "") + ")")
            else js("window.onOcrText && window.onOcrText(" + JSONObject.quote(result) + ", 'ok')")
        }.start()
    }

    /** Hands the photo to Google Lens (inside the Google app); the user copies the text there. */
    private fun sendToLens(uri: Uri) {
        val shareable = if (uri.authority == "$packageName.files") uri else copyToCache(uri) ?: uri
        fun send(pkg: String?): Boolean {
            val i = Intent(Intent.ACTION_SEND).apply {
                type = "image/jpeg"
                putExtra(Intent.EXTRA_STREAM, shareable)
                clipData = ClipData.newRawUri("note", shareable)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                if (pkg != null) setPackage(pkg)
            }
            return try { startActivity(i); true } catch (_: ActivityNotFoundException) { false } catch (_: SecurityException) { false }
        }
        if (send("com.google.android.googlequicksearchbox") || send("com.google.ar.lens")) {
            js("window.onLensOpened && window.onLensOpened()")
            return
        }
        // No Google app: let the user pick where to send the photo
        try {
            val i = Intent(Intent.ACTION_SEND).apply {
                type = "image/jpeg"; putExtra(Intent.EXTRA_STREAM, shareable)
                clipData = ClipData.newRawUri("note", shareable); addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            startActivity(Intent.createChooser(i, "Google Lens"))
            js("window.onLensOpened && window.onLensOpened()")
        } catch (e: Exception) {
            js("window.onOcrText && window.onOcrText(null, 'nolens')")
        }
    }

    private fun copyToCache(uri: Uri): Uri? = try {
        val target = newPhotoUri()
        contentResolver.openInputStream(uri)?.use { input -> contentResolver.openOutputStream(target)?.use { input.copyTo(it) } }
        target
    } catch (_: Exception) { null }

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
            panelTop = bars.top; panelBottom = maxOf(bars.bottom, ime.bottom)
            webPanel?.setPadding(0, panelTop, 0, panelBottom)
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
                val queued = pendingJs.toList(); pendingJs.clear()
                queued.forEach { web.evaluateJavascript(it, null) }
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
                if (webPanel != null) {
                    val b = browser
                    if (b != null && b.canGoBack()) b.goBack() else closeWebPanel(true)
                    return
                }
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
        savedInstanceState?.getString("photoUri")?.let { photoUri = Uri.parse(it) }
        savedInstanceState?.getString("photoMode")?.let { photoMode = it }
        if (savedInstanceState != null) web.restoreState(savedInstanceState)
        else web.loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
    }

    private var insetsJs: String? = null

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
        photoUri?.let { outState.putString("photoUri", it.toString()) }
        outState.putString("photoMode", photoMode)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleShareIntent(intent)
    }

    override fun onPause() {
        RestTimer.appVisible = false
        if (::web.isInitialized) {
            web.evaluateJavascript("window.appPause && window.appPause()", null)
            web.onPause() // stops animated backgrounds while the app is in the background
        }
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        RestTimer.appVisible = true
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

    private val pendingJs = mutableListOf<String>()

    // ---------- a manufacturer's web page inside the app, to read a product's nutrition values ----------
    private var webPanel: LinearLayout? = null
    private var browser: WebView? = null
    private var panelTop = 0
    private var panelBottom = 0
    private val extractJs: String by lazy {
        try { assets.open("www/extract.js").bufferedReader().use { it.readText() } } catch (_: Exception) { "JSON.stringify({ok:false})" }
    }

    /** Opens a web page over the app, with a button that reads the nutrition table from it (www/extract.js). */
    @SuppressLint("SetJavaScriptEnabled")
    fun openWeb(url: String, lang: String, dark: Boolean) {
        runOnUiThread {
            removeWebPanel()
            val he = lang != "en"
            val d = resources.displayMetrics.density
            fun dp(v: Int) = (v * d).toInt()
            val bg = if (dark) Color.parseColor("#1B1D1A") else Color.WHITE
            val fg = if (dark) Color.parseColor("#ECEDE8") else Color.parseColor("#1D2620")
            val panel = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setBackgroundColor(bg)
                isClickable = true
                setPadding(0, panelTop, 0, panelBottom)
                layoutDirection = if (he) android.view.View.LAYOUT_DIRECTION_RTL else android.view.View.LAYOUT_DIRECTION_LTR
            }
            val bar = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL; setPadding(dp(4), dp(2), dp(12), dp(2)) }
            val close = TextView(this).apply {
                text = "✕"; textSize = 20f; setTextColor(fg); gravity = Gravity.CENTER
                contentDescription = if (he) "סגירה" else "Close"
                setOnClickListener { closeWebPanel(true) }
            }
            val title = TextView(this).apply {
                text = if (he) "טוען…" else "Loading…"; textSize = 15f; setTextColor(fg)
                maxLines = 1; ellipsize = TextUtils.TruncateAt.END
            }
            bar.addView(close, LinearLayout.LayoutParams(dp(48), dp(48)))
            bar.addView(title, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
            val wv = WebView(this)
            wv.settings.javaScriptEnabled = true
            wv.settings.domStorageEnabled = true
            wv.settings.useWideViewPort = true
            wv.settings.loadWithOverviewMode = true
            wv.webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    val sc = request.url.scheme ?: ""
                    return !(sc == "http" || sc == "https") // stay on the web; ignore app links
                }
                override fun onPageFinished(view: WebView, u: String?) {
                    title.text = view.title?.takeIf { it.isNotBlank() } ?: (u ?: "")
                }
            }
            val take = TextView(this).apply {
                text = if (he) "קח את הערכים מהדף" else "Use the values on this page"
                textSize = 16f; setTextColor(Color.WHITE); gravity = Gravity.CENTER
                setTypeface(typeface, android.graphics.Typeface.BOLD)
                background = GradientDrawable().apply { setColor(Color.parseColor("#2F7D4F")); cornerRadius = 14 * d }
                setOnClickListener {
                    wv.evaluateJavascript(extractJs) { r -> js("window.onWebValues && window.onWebValues(${r ?: "null"})") }
                }
            }
            panel.addView(bar, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))
            panel.addView(wv, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))
            panel.addView(take, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(52)).apply { setMargins(dp(12), dp(8), dp(12), dp(10)) })
            root.addView(panel, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
            webPanel = panel
            browser = wv
            wv.loadUrl(url)
        }
    }

    private fun removeWebPanel() {
        val p = webPanel ?: return
        browser?.let { b -> b.stopLoading(); b.loadUrl("about:blank"); b.destroy() }
        root.removeView(p)
        webPanel = null
        browser = null
    }

    /** byUser: closed with ✕ or back, so the page hears about it. */
    fun closeWebPanel(byUser: Boolean) {
        runOnUiThread {
            if (webPanel == null) return@runOnUiThread
            removeWebPanel()
            if (byUser) js("window.onWebClosed && window.onWebClosed()")
        }
    }

    fun webMessage(text: String) {
        runOnUiThread { Toast.makeText(this, text, Toast.LENGTH_LONG).show() }
    }

    fun js(code: String) {
        runOnUiThread {
            if (!::web.isInitialized) return@runOnUiThread
            if (pageReady) web.evaluateJavascript(code, null) else pendingJs.add(code)
        }
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
