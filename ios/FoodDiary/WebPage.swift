import UIKit
import WebKit

/// A manufacturer's web page shown over the app, with a button that reads the product's
/// nutrition table from it (the same www/extract.js the Android app runs).
final class WebPageViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private let url: URL
    private let he: Bool
    private let dark: Bool
    private var web: WKWebView!
    private let note = UILabel()
    private var noteTimer: Timer?
    var onValues: ((String) -> Void)?
    var onClosed: (() -> Void)?

    static let extractJS: String = {
        if let u = Bundle.main.url(forResource: "extract", withExtension: "js", subdirectory: "www"),
           let s = try? String(contentsOf: u, encoding: .utf8) { return s }
        return "JSON.stringify({ok:false})"
    }()

    init(url: URL, he: Bool, dark: Bool) {
        self.url = url
        self.he = he
        self.dark = dark
        super.init(nibName: nil, bundle: nil)
    }
    required init?(coder: NSCoder) { fatalError("not used") }

    override func viewDidLoad() {
        super.viewDidLoad()
        overrideUserInterfaceStyle = dark ? .dark : .light
        view.semanticContentAttribute = he ? .forceRightToLeft : .forceLeftToRight
        view.backgroundColor = .systemBackground
        title = he ? "טוען…" : "Loading…"
        navigationItem.leftBarButtonItem = UIBarButtonItem(barButtonSystemItem: .close, target: self, action: #selector(closeTapped))
        navigationItem.rightBarButtonItem = UIBarButtonItem(image: UIImage(systemName: he ? "chevron.right" : "chevron.left"),
                                                            style: .plain, target: self, action: #selector(backTapped))

        web = WKWebView(frame: .zero, configuration: WKWebViewConfiguration())
        web.navigationDelegate = self
        web.uiDelegate = self
        web.allowsBackForwardNavigationGestures = true
        web.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(web)

        let take = UIButton(type: .system)
        take.setTitle(he ? "קח את הערכים מהדף" : "Use the values on this page", for: .normal)
        take.titleLabel?.font = .boldSystemFont(ofSize: 17)
        take.setTitleColor(.white, for: .normal)
        take.backgroundColor = UIColor(red: 0.184, green: 0.49, blue: 0.31, alpha: 1)
        take.layer.cornerRadius = 14
        take.translatesAutoresizingMaskIntoConstraints = false
        take.addTarget(self, action: #selector(takeTapped), for: .touchUpInside)
        view.addSubview(take)

        note.numberOfLines = 0
        note.textAlignment = .center
        note.font = .systemFont(ofSize: 15)
        note.textColor = .white
        note.backgroundColor = UIColor(white: 0.12, alpha: 0.92)
        note.layer.cornerRadius = 12
        note.clipsToBounds = true
        note.alpha = 0
        note.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(note)

        NSLayoutConstraint.activate([
            web.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            web.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            web.bottomAnchor.constraint(equalTo: take.topAnchor, constant: -8),
            take.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 12),
            take.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -12),
            take.heightAnchor.constraint(equalToConstant: 52),
            take.bottomAnchor.constraint(equalTo: view.keyboardLayoutGuide.topAnchor, constant: -8),
            note.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            note.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            note.bottomAnchor.constraint(equalTo: take.topAnchor, constant: -16),
        ])
        web.load(URLRequest(url: url))
    }

    @objc private func closeTapped() {
        let done = onClosed
        dismiss(animated: true) { done?() }
    }
    @objc private func backTapped() { if web.canGoBack { web.goBack() } }
    @objc private func takeTapped() {
        web.evaluateJavaScript(Self.extractJS) { [weak self] r, _ in
            self?.onValues?((r as? String) ?? "{\"ok\":false}")
        }
    }

    /// A short message over the page (when the values weren't found).
    func flash(_ text: String) {
        note.text = "  \(text)  "
        noteTimer?.invalidate()
        UIView.animate(withDuration: 0.2) { self.note.alpha = 1 }
        noteTimer = Timer.scheduledTimer(withTimeInterval: 4.5, repeats: false) { [weak self] _ in
            UIView.animate(withDuration: 0.3) { self?.note.alpha = 0 }
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if let t = webView.title, !t.isEmpty { title = t }
    }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        let s = navigationAction.request.url?.scheme ?? ""
        decisionHandler(s == "http" || s == "https" || s == "about" ? .allow : .cancel)
    }
    /// Links that open a new window open here.
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if navigationAction.targetFrame == nil { webView.load(navigationAction.request) }
        return nil
    }
}
