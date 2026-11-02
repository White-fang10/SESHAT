package com.example

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private lateinit var fileChooserLauncher: ActivityResultLauncher<Intent>

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // File picker result launcher for note image attachments
        fileChooserLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            if (fileUploadCallback == null) return@registerForActivityResult
            val results: Array<Uri>? = if (result.resultCode == RESULT_OK) {
                val data = result.data
                if (data?.clipData != null) {
                    val count = data.clipData!!.itemCount
                    val uris = mutableListOf<Uri>()
                    for (i in 0 until count) {
                        uris.add(data.clipData!!.getItemAt(i).uri)
                    }
                    uris.toTypedArray()
                } else if (data?.data != null) {
                    arrayOf(data.data!!)
                } else {
                    null
                }
            } else {
                null
            }
            fileUploadCallback?.onReceiveValue(results)
            fileUploadCallback = null
        }

        // Configure WebViewAssetLoader for secure HTTPS local asset serving
        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        val rootLayout = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(0xFFFFFBF2.toInt())
        }

        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
            setBackgroundColor(0x00000000)

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                @Suppress("DEPRECATION")
                allowFileAccessFromFileURLs = true
                @Suppress("DEPRECATION")
                allowUniversalAccessFromFileURLs = true
                useWideViewPort = true
                loadWithOverviewMode = true
                cacheMode = WebSettings.LOAD_DEFAULT
                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                displayZoomControls = false
                builtInZoomControls = false
                setSupportZoom(false)
            }

            addJavascriptInterface(WebAppInterface(this@MainActivity), "AndroidBridge")

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? {
                    val url = request.url
                    if (url.host == "appassets.androidplatform.net") {
                        val path = (url.path ?: "").removePrefix("/")
                        val target = if (path.isEmpty()) "index.html" else path
                        val candidates = listOf(
                            target,
                            if (target.startsWith("assets/")) target.removePrefix("assets/") else "assets/$target",
                            "public/$target",
                            "public/assets/$target"
                        )
                        for (candidate in candidates) {
                            try {
                                val isStream = assets.open(candidate)
                                val mime = when {
                                    candidate.endsWith(".html") -> "text/html"
                                    candidate.endsWith(".js") -> "application/javascript"
                                    candidate.endsWith(".css") -> "text/css"
                                    candidate.endsWith(".svg") -> "image/svg+xml"
                                    candidate.endsWith(".png") -> "image/png"
                                    candidate.endsWith(".jpg") || candidate.endsWith(".jpeg") -> "image/jpeg"
                                    candidate.endsWith(".json") -> "application/json"
                                    candidate.endsWith(".woff2") -> "font/woff2"
                                    candidate.endsWith(".woff") -> "font/woff"
                                    candidate.endsWith(".ttf") -> "font/ttf"
                                    candidate.endsWith(".ico") -> "image/x-icon"
                                    else -> "application/octet-stream"
                                }
                                val response = WebResourceResponse(mime, "UTF-8", isStream)
                                response.responseHeaders = mapOf(
                                    "Access-Control-Allow-Origin" to "*",
                                    "Cache-Control" to "no-cache"
                                )
                                return response
                            } catch (_: Exception) {}
                        }
                    }
                    return null
                }

                override fun onReceivedError(
                    view: WebView,
                    request: WebResourceRequest,
                    error: android.webkit.WebResourceError
                ) {
                    super.onReceivedError(view, request, error)
                    Log.e("Sesh@", "Resource load error: ${error.description} for ${request.url}")
                }

                override fun shouldOverrideUrlLoading(
                    view: WebView,
                    request: WebResourceRequest
                ): Boolean {
                    val url = request.url.toString()
                    return if (url.startsWith("https://appassets.androidplatform.net") ||
                        url.startsWith("file:///android_asset/")
                    ) {
                        false
                    } else if (url.startsWith("mailto:") || url.startsWith("tel:")) {
                        try {
                            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        } catch (e: Exception) {
                            Log.e("Sesh@", "Failed to open external intent: $url", e)
                        }
                        true
                    } else {
                        // Open external links in browser
                        try {
                            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        } catch (e: Exception) {
                            Log.e("Sesh@", "Failed to launch browser: $url", e)
                        }
                        true
                    }
                }

                override fun onPageFinished(view: WebView, url: String) {
                    super.onPageFinished(view, url)
                    injectSafeAreaInsets()
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    fileUploadCallback?.onReceiveValue(null)
                    fileUploadCallback = filePathCallback

                    val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                        type = "*/*"
                        addCategory(Intent.CATEGORY_OPENABLE)
                    }
                    try {
                        fileChooserLauncher.launch(intent)
                    } catch (e: Exception) {
                        fileUploadCallback = null
                        return false
                    }
                    return true
                }

                override fun onPermissionRequest(request: PermissionRequest?) {
                    request?.grant(request.resources)
                }

                override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                    consoleMessage?.let {
                        Log.d("Sesh@Web", "${it.message()} -- From line ${it.lineNumber()} of ${it.sourceId()}")
                    }
                    return true
                }
            }
        }

        rootLayout.addView(webView)
        setContentView(rootLayout)

        // Listen for Window Insets to adapt safe areas (notches, navigation bars)
        ViewCompat.setOnApplyWindowInsetsListener(rootLayout) { _, insets ->
            val statusBars = insets.getInsets(WindowInsetsCompat.Type.statusBars())
            val navBars = insets.getInsets(WindowInsetsCompat.Type.navigationBars())
            val displayCutout = insets.getInsets(WindowInsetsCompat.Type.displayCutout())

            val topPx = maxOf(statusBars.top, displayCutout.top)
            val bottomPx = maxOf(navBars.bottom, displayCutout.bottom)

            injectSafeAreaInsets(topPx, bottomPx)
            insets
        }

        // Handle System Back Button
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript(
                    "(function() { return !!(window.handleAndroidBack && window.handleAndroidBack()); })()"
                ) { result ->
                    val handled = result?.trim()?.equals("true", ignoreCase = true) == true
                    if (!handled) {
                        if (webView.canGoBack()) {
                            webView.goBack()
                        } else {
                            isEnabled = false
                            onBackPressedDispatcher.onBackPressed()
                            isEnabled = true
                        }
                    }
                }
            }
        })

        // Load application through secure asset loader
        webView.loadUrl("https://appassets.androidplatform.net/index.html")
    }

    private fun injectSafeAreaInsets(topPx: Int = 0, bottomPx: Int = 0) {
        val density = resources.displayMetrics.density
        val topDp = (topPx / density).toInt()
        val bottomDp = (bottomPx / density).toInt()

        val js = """
            (function() {
                document.documentElement.style.setProperty('--safe-area-inset-top', '${topDp}px');
                document.documentElement.style.setProperty('--safe-area-inset-bottom', '${bottomDp}px');
            })();
        """.trimIndent()
        webView.evaluateJavascript(js, null)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    inner class WebAppInterface(private val context: Context) {

        @JavascriptInterface
        fun triggerHaptic(intensity: String?) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                    val vibrator = vibratorManager?.defaultVibrator
                    val duration = if (intensity == "heavy") 40L else 15L
                    vibrator?.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                    val duration = if (intensity == "heavy") 40L else 15L
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vibrator?.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE))
                    } else {
                        @Suppress("DEPRECATION")
                        vibrator?.vibrate(duration)
                    }
                }
            } catch (e: Exception) {
                Log.w("Sesh@", "Vibration failed: ${e.message}")
            }
        }

        @JavascriptInterface
        fun shareText(title: String, text: String, url: String) {
            val shareBody = if (url.isNotEmpty()) "$text\n\n$url" else text
            val sendIntent = Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_TITLE, title)
                putExtra(Intent.EXTRA_SUBJECT, title)
                putExtra(Intent.EXTRA_TEXT, shareBody)
                type = "text/plain"
            }
            val shareIntent = Intent.createChooser(sendIntent, title)
            context.startActivity(shareIntent)
        }

        @JavascriptInterface
        fun showToast(message: String) {
            runOnUiThread {
                Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
            }
        }

        @JavascriptInterface
        fun finishActivity() {
            runOnUiThread {
                finish()
            }
        }

        @JavascriptInterface
        fun postMessage(action: String, payload: String?) {
            Log.d("Sesh@", "Message from web: $action, payload: $payload")
        }
    }
}
