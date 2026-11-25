import UIKit

/// The same `window.Android` object the Android app gives the page, so the web code runs unchanged.
/// Calls that return a value go through `prompt()` (answered synchronously by the web view's UI delegate);
/// the rest are posted as messages.
final class Bridge {
    static let syncToken = "__fd_bridge__"

    static let shimJS = """
    (function () {
      if (window.Android) return;
      var call = function (m, a) {
        try { var r = window.prompt('\(syncToken)', JSON.stringify({ m: m, a: a })); return r == null ? undefined : JSON.parse(r); }
        catch (e) { return undefined; }
      };
      var post = function (m, a) { try { window.webkit.messageHandlers.fd.postMessage({ m: m, a: a }); } catch (e) { } };
      var SYNC = ['isApp', 'appVersion', 'readClipboard', 'clipboardChanged', 'readAutoBackup', 'takePendingWater', 'hasNotificationPermission', 'ocrHebrew'];
      var ASYNC = ['setLang', 'saveFile', 'shareText', 'toast', 'setBars', 'photo', 'ocrCamera', 'ocrGallery', 'setReminder', 'setDayStatus',
        'aiStream', 'aiGet', 'aiCancel', 'setWaterStatus', 'setWaterReminder', 'requestNotificationPermission', 'restStart', 'restCancel', 'vibrate', 'autoBackup', 'openWeb', 'closeWeb', 'webMessage'];
      var A = {};
      SYNC.forEach(function (n) { A[n] = function () { return call(n, Array.prototype.slice.call(arguments)); }; });
      ASYNC.forEach(function (n) { A[n] = function () { post(n, Array.prototype.slice.call(arguments)); }; });
      window.Android = A;
      window.__IOS = true;
      var mark = function () { if (document.documentElement) document.documentElement.classList.add('ios'); };
      if (document.documentElement) mark(); else document.addEventListener('DOMContentLoaded', mark);
    })();
    """

    weak var vc: WebViewController?
    private let d = UserDefaults.standard
    /// Clipboard state when Google Lens was opened, to tell whether something new was copied there.
    var lensClipCount = -1

    init(vc: WebViewController) { self.vc = vc }

    private func str(_ a: [Any], _ i: Int) -> String { i < a.count ? (a[i] as? String ?? "\(a[i])") : "" }
    private func int(_ a: [Any], _ i: Int) -> Int {
        guard i < a.count else { return 0 }
        if let n = a[i] as? NSNumber { return n.intValue }
        return Int("\(a[i])") ?? 0
    }
    private func bool(_ a: [Any], _ i: Int) -> Bool {
        guard i < a.count else { return false }
        if let n = a[i] as? NSNumber { return n.boolValue }
        return "\(a[i])" == "true"
    }

    /// Calls that return a value. Returns JSON, or nil for "undefined".
    func sync(_ json: String) -> String? {
        guard let data = json.data(using: .utf8),
              let o = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
              let m = o["m"] as? String else { return nil }
        let r: Any
        switch m {
        case "isApp": r = true
        case "appVersion": r = (Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String) ?? ""
        case "readClipboard": r = UIPasteboard.general.string ?? ""
        case "clipboardChanged":
            r = lensClipCount >= 0 && UIPasteboard.general.changeCount != lensClipCount && UIPasteboard.general.hasStrings
        case "readAutoBackup": r = Backup.read()
        case "takePendingWater": r = Notifications.takePending()
        case "hasNotificationPermission": r = Notifications.authorized
        case "ocrHebrew": r = OCR.supportsHebrew
        default: return nil
        }
        guard let out = try? JSONSerialization.data(withJSONObject: r, options: [.fragmentsAllowed]) else { return nil }
        return String(data: out, encoding: .utf8)
    }

    /// Calls that return nothing.
    func async(_ m: String, _ a: [Any]) {
        guard let vc = vc else { return }
        let js: (String) -> Void = { [weak vc] code in vc?.js(code) }
        switch m {
        case "setLang":
            d.set(str(a, 0) == "en" ? "en" : "he", forKey: "lang")
            Notifications.rescheduleAll()
        case "saveFile": vc.saveFile(name: str(a, 0), content: str(a, 1))
        case "shareText": vc.share(items: [str(a, 0)])
        case "toast": break
        case "setBars": vc.setBars(bg: str(a, 0), dark: bool(a, 1))
        case "photo": vc.photo(mode: str(a, 0), source: str(a, 1))
        case "ocrCamera": vc.photo(mode: "ocr", source: "camera")
        case "ocrGallery": vc.photo(mode: "ocr", source: "gallery")
        case "setReminder": Notifications.setMealReminder(on: bool(a, 0), h: int(a, 1), m: int(a, 2))
        case "setDayStatus": Notifications.setDayStatus(date: str(a, 0), meals: int(a, 1))
        case "aiStream": Gemini.stream(id: str(a, 0), model: str(a, 1), key: str(a, 2), body: str(a, 3), js: js)
        case "aiGet": Gemini.get(id: str(a, 0), path: str(a, 1), key: str(a, 2), js: js)
        case "aiCancel": Gemini.cancel(id: str(a, 0))
        case "setWaterStatus": Notifications.setWaterStatus(date: str(a, 0), ml: int(a, 1), goal: int(a, 2), cup: int(a, 3))
        case "setWaterReminder": Notifications.setWaterReminder(on: bool(a, 0), wake: int(a, 1), sleep: int(a, 2), every: int(a, 3))
        case "requestNotificationPermission":
            Notifications.requestPermission { ok in js("window.onNotifPermission && window.onNotifPermission(\(ok))") }
        case "restStart": Notifications.restStart(seconds: int(a, 0), title: str(a, 1), text: str(a, 2))
        case "restCancel": Notifications.restCancel()
        case "vibrate": Haptics.buzz(long: bool(a, 0))
        case "autoBackup": Backup.write(str(a, 0))
        case "openWeb": vc.openWeb(url: str(a, 0), lang: str(a, 1), dark: bool(a, 2))
        case "closeWeb": vc.closeWeb()
        case "webMessage": vc.webMessage(str(a, 0))
        default: break
        }
    }
}
