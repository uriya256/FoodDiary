import UIKit
import WebKit
import PhotosUI

final class WebViewController: UIViewController, WKUIDelegate, WKNavigationDelegate, WKScriptMessageHandler,
    UIImagePickerControllerDelegate, UINavigationControllerDelegate, PHPickerViewControllerDelegate {

    static weak var current: WebViewController?

    private var web: WKWebView!
    private var bridge: Bridge!
    private var pageReady = false
    private var queue: [String] = []
    private var barStyle: UIStatusBarStyle = .darkContent
    private var keyboardOpen = false
    private var bg = UIColor(red: 0.953, green: 0.957, blue: 0.937, alpha: 1)

    override func loadView() {
        let cfg = WKWebViewConfiguration()
        cfg.setURLSchemeHandler(AssetSchemeHandler(), forURLScheme: AssetSchemeHandler.scheme)
        let uc = WKUserContentController()
        uc.addUserScript(WKUserScript(source: Bridge.shimJS, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        uc.add(WeakMessageHandler(self), name: "fd")
        cfg.userContentController = uc
        cfg.allowsInlineMediaPlayback = true
        cfg.websiteDataStore = .default()
        let wv = WKWebView(frame: UIScreen.main.bounds, configuration: cfg)
        wv.uiDelegate = self
        wv.navigationDelegate = self
        wv.scrollView.contentInsetAdjustmentBehavior = .never
        wv.scrollView.bounces = false
        wv.isOpaque = false
        wv.backgroundColor = bg
        wv.scrollView.backgroundColor = bg
        wv.allowsLinkPreview = false
        if #available(iOS 16.4, *) { wv.isInspectable = true }
        web = wv
        view = wv
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        WebViewController.current = self
        bridge = Bridge(vc: self)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardShown), name: UIResponder.keyboardWillShowNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardHidden), name: UIResponder.keyboardWillHideNotification, object: nil)
        web.load(URLRequest(url: URL(string: "\(AssetSchemeHandler.scheme)://localhost/index.html")!))
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { barStyle }

    override func viewSafeAreaInsetsDidChange() {
        super.viewSafeAreaInsetsDidChange()
        sendInsets()
    }

    @objc private func keyboardShown() { keyboardOpen = true; sendInsets() }
    @objc private func keyboardHidden() { keyboardOpen = false; sendInsets() }

    private func sendInsets() {
        let i = view.safeAreaInsets
        js("window.setInsets && window.setInsets(\(Int(i.top.rounded())), \(keyboardOpen ? 0 : Int(i.bottom.rounded())))")
    }

    /// Runs JavaScript in the page; waits until the page has loaded.
    func js(_ code: String) {
        DispatchQueue.main.async {
            guard self.pageReady else { self.queue.append(code); return }
            self.web.evaluateJavaScript(code, completionHandler: nil)
        }
    }

    func appPause() { js("window.appPause && window.appPause()") }

    // MARK: page loading and links

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        pageReady = true
        sendInsets()
        let q = queue
        queue.removeAll()
        q.forEach { web.evaluateJavaScript($0, completionHandler: nil) }
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        pageReady = false
        webView.reload()
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url, let scheme = url.scheme?.lowercased() else { decisionHandler(.cancel); return }
        if [AssetSchemeHandler.scheme, "about", "blob", "data"].contains(scheme) { decisionHandler(.allow); return }
        // web links open in Safari
        UIApplication.shared.open(url)
        decisionHandler(.cancel)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url, url.scheme?.hasPrefix("http") == true { UIApplication.shared.open(url) }
        return nil
    }

    // MARK: bridge

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let m = body["m"] as? String else { return }
        bridge.async(m, body["a"] as? [Any] ?? [])
    }

    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        if prompt == Bridge.syncToken {
            completionHandler(bridge.sync(defaultText ?? "{}"))
            return
        }
        let a = UIAlertController(title: nil, message: prompt, preferredStyle: .alert)
        a.addTextField { $0.text = defaultText }
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(a.textFields?.first?.text) })
        a.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(nil) })
        topPresenter().present(a, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        topPresenter().present(a, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        a.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) })
        topPresenter().present(a, animated: true)
    }

    // MARK: things the page asks for

    func setBars(bg hex: String, dark: Bool) {
        if let c = UIColor(hex: hex) {
            bg = c
            view.backgroundColor = c
            web.backgroundColor = c
            web.scrollView.backgroundColor = c
        }
        barStyle = dark ? .lightContent : .darkContent
        setNeedsStatusBarAppearanceUpdate()
    }

    // MARK: a manufacturer's web page, to read a product's nutrition values
    private weak var webPage: WebPageViewController?

    func openWeb(url: String, lang: String, dark: Bool) {
        guard let u = URL(string: url) else { return }
        let page = WebPageViewController(url: u, he: lang != "en", dark: dark)
        page.onValues = { [weak self] s in self?.js("window.onWebValues && window.onWebValues(\(jsq(s)))") }
        page.onClosed = { [weak self] in self?.js("window.onWebClosed && window.onWebClosed()") }
        let nav = UINavigationController(rootViewController: page)
        nav.modalPresentationStyle = .fullScreen
        let show = { self.topPresenter().present(nav, animated: true); self.webPage = page }
        if let old = webPage?.navigationController { old.dismiss(animated: false, completion: show) } else { show() }
    }
    func closeWeb() { webPage?.navigationController?.dismiss(animated: true) }
    func webMessage(_ text: String) { webPage?.flash(text) }

    private func topPresenter() -> UIViewController {
        var top: UIViewController = self
        while let p = top.presentedViewController { top = p }
        return top
    }

    func share(items: [Any]) {
        let a = UIActivityViewController(activityItems: items, applicationActivities: nil)
        a.popoverPresentationController?.sourceView = view
        a.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.maxY - 90, width: 1, height: 1)
        topPresenter().present(a, animated: true)
    }

    /// Backups and exports: written to a file, then the share sheet ("Save to Files", mail, WhatsApp…).
    func saveFile(name: String, content: String) {
        let safe = name.replacingOccurrences(of: "/", with: "-").trimmingCharacters(in: .whitespaces)
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(safe.isEmpty ? "FoodDiary.txt" : safe)
        do { try content.data(using: .utf8)?.write(to: url, options: .atomic) } catch { return }
        share(items: [url])
    }

    // MARK: photos (reading a handwritten note)

    func photo(mode: String, source: String) {
        if mode == "lens" { openGoogleLens(); return }
        if source == "camera" {
            guard UIImagePickerController.isSourceTypeAvailable(.camera) else {
                js("window.onOcrText && window.onOcrText(null, 'nocamera', '')"); return
            }
            let p = UIImagePickerController()
            p.sourceType = .camera
            p.delegate = self
            topPresenter().present(p, animated: true)
        } else {
            var cfg = PHPickerConfiguration()
            cfg.filter = .images
            cfg.selectionLimit = 1
            let p = PHPickerViewController(configuration: cfg)
            p.delegate = self
            topPresenter().present(p, animated: true)
        }
    }

    /// Opens the Google app (Lens is the camera icon in its search bar); the copied text is picked up on return.
    private func openGoogleLens() {
        bridge.lensClipCount = UIPasteboard.general.changeCount
        let urls = ["google://", "googleapp://"].compactMap { URL(string: $0) }
        func attempt(_ i: Int) {
            guard i < urls.count else { js("window.onOcrText && window.onOcrText(null, 'nolens', '')"); return }
            UIApplication.shared.open(urls[i], options: [:]) { ok in
                if ok { self.js("window.onLensOpened && window.onLensOpened()") } else { attempt(i + 1) }
            }
        }
        attempt(0)
    }

    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true)
        js("window.onOcrText && window.onOcrText(null, 'cancel', '')")
    }

    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
        picker.dismiss(animated: true)
        guard let img = info[.originalImage] as? UIImage else { js("window.onOcrText && window.onOcrText(null, 'error', 'image')"); return }
        read(img)
    }

    func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true)
        guard let item = results.first?.itemProvider, item.canLoadObject(ofClass: UIImage.self) else {
            js("window.onOcrText && window.onOcrText(null, 'cancel', '')"); return
        }
        item.loadObject(ofClass: UIImage.self) { obj, _ in
            DispatchQueue.main.async {
                guard let img = obj as? UIImage else { self.js("window.onOcrText && window.onOcrText(null, 'error', 'image')"); return }
                self.read(img)
            }
        }
    }

    private func read(_ img: UIImage) {
        js("window.onOcrStart && window.onOcrStart()")
        OCR.recognize(img) { text, detail in
            if let t = text { self.js("window.onOcrText && window.onOcrText(\(jsq(t)), 'ok', '')") }
            else { self.js("window.onOcrText && window.onOcrText(null, 'error', \(jsq(detail)))") }
        }
    }
}

/// Keeps the web view from holding its controller forever.
final class WeakMessageHandler: NSObject, WKScriptMessageHandler {
    weak var target: WKScriptMessageHandler?
    init(_ t: WKScriptMessageHandler) { target = t }
    func userContentController(_ uc: WKUserContentController, didReceive message: WKScriptMessage) {
        target?.userContentController(uc, didReceive: message)
    }
}

extension UIColor {
    convenience init?(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("#") { s.removeFirst() }
        guard s.count == 6 || s.count == 8, let v = UInt64(s, radix: 16) else { return nil }
        let a, r, g, b: UInt64
        if s.count == 8 { (a, r, g, b) = (v >> 24 & 0xFF, v >> 16 & 0xFF, v >> 8 & 0xFF, v & 0xFF) }
        else { (a, r, g, b) = (255, v >> 16 & 0xFF, v >> 8 & 0xFF, v & 0xFF) }
        self.init(red: CGFloat(r) / 255, green: CGFloat(g) / 255, blue: CGFloat(b) / 255, alpha: CGFloat(a) / 255)
    }
}
