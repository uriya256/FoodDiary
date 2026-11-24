import Foundation

/// The in-app chat talks to Google Gemini from here (not from the page), and streams the answer back.
enum Gemini {
    private static let base = "https://generativelanguage.googleapis.com/v1beta/"
    private static var running: [String: Task<Void, Never>] = [:]

    private static func enc(_ s: String) -> String {
        s.addingPercentEncoding(withAllowedCharacters: .alphanumerics.union(CharacterSet(charactersIn: "-._~"))) ?? s
    }

    /// Error codes for failures without an HTTP answer: 0 no internet, -1 the connection dropped, -2 Google didn't answer in time.
    private static func failCode(_ error: Error) -> Int {
        guard let e = error as? URLError else { return -1 }
        switch e.code {
        case .notConnectedToInternet, .dataNotAllowed, .internationalRoamingOff: return 0
        case .timedOut: return -2
        default: return -1
        }
    }

    static func stream(id: String, model: String, key: String, body: String, js: @escaping (String) -> Void) {
        guard model.range(of: "^[A-Za-z0-9._-]{3,80}$", options: .regularExpression) != nil else {
            js("window.onAiError && window.onAiError(\(jsq(id)), 404, 'bad model')"); return
        }
        let task = Task {
            // The key goes in the x-goog-api-key header; if Google refuses that, try once with ?key=
            for attempt in 0...1 {
                let viaQuery = attempt == 1
                var s = base + "models/\(model):streamGenerateContent?alt=sse"
                if viaQuery { s += "&key=" + enc(key) }
                guard let url = URL(string: s) else { break }
                var req = URLRequest(url: url, timeoutInterval: 90)
                req.httpMethod = "POST"
                req.setValue("application/json; charset=utf-8", forHTTPHeaderField: "Content-Type")
                if !viaQuery { req.setValue(key, forHTTPHeaderField: "x-goog-api-key") }
                req.httpBody = body.data(using: .utf8)
                do {
                    let (bytes, resp) = try await URLSession.shared.bytes(for: req)
                    let code = (resp as? HTTPURLResponse)?.statusCode ?? 0
                    if !(200...299).contains(code) {
                        var data = Data()
                        for try await b in bytes { data.append(b); if data.count > 4000 { break } }
                        if !viaQuery && (code == 401 || code == 403) && !Task.isCancelled { continue }
                        js("window.onAiError && window.onAiError(\(jsq(id)), \(code), \(jsq(String(decoding: data, as: UTF8.self))))")
                        break
                    }
                    for try await line in bytes.lines {
                        if Task.isCancelled { break }
                        if line.hasPrefix("data:") {
                            let payload = String(line.dropFirst(5)).trimmingCharacters(in: .whitespaces)
                            js("window.onAiChunk && window.onAiChunk(\(jsq(id)), \(jsq(payload)))")
                        }
                    }
                    if !Task.isCancelled { js("window.onAiDone && window.onAiDone(\(jsq(id)))") }
                    break
                } catch {
                    if !Task.isCancelled { js("window.onAiError && window.onAiError(\(jsq(id)), \(failCode(error)), \(jsq(error.localizedDescription)))") }
                    break
                }
            }
            DispatchQueue.main.async { running[id] = nil }
        }
        running[id] = task
    }

    static func get(id: String, path: String, key: String, js: @escaping (String) -> Void) {
        guard path.range(of: "^models(\\?[A-Za-z0-9=&_-]*)?$", options: .regularExpression) != nil else {
            js("window.onAiHttp && window.onAiHttp(\(jsq(id)), 400, '')"); return
        }
        Task {
            var code = 0
            var text = ""
            for attempt in 0...1 {
                let viaQuery = attempt == 1
                let s = base + path + (viaQuery ? (path.contains("?") ? "&" : "?") + "key=" + enc(key) : "")
                guard let url = URL(string: s) else { break }
                var req = URLRequest(url: url, timeoutInterval: 30)
                if !viaQuery { req.setValue(key, forHTTPHeaderField: "x-goog-api-key") }
                do {
                    let (data, resp) = try await URLSession.shared.data(for: req)
                    code = (resp as? HTTPURLResponse)?.statusCode ?? 0
                    text = String(decoding: data, as: UTF8.self)
                } catch {
                    code = failCode(error)
                    text = error.localizedDescription
                }
                if viaQuery || (code != 401 && code != 403) { break }
            }
            js("window.onAiHttp && window.onAiHttp(\(jsq(id)), \(code), \(jsq(text)))")
        }
    }

    static func cancel(id: String) {
        running[id]?.cancel()
        running[id] = nil
    }
}
