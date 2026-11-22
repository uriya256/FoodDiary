import UIKit
import Vision

/// Reads text from a photo with Apple's built-in text recognition (on the phone, no internet).
enum OCR {
    private static func request() -> VNRecognizeTextRequest {
        let r = VNRecognizeTextRequest()
        r.recognitionLevel = .accurate
        r.usesLanguageCorrection = true
        return r
    }

    static var supportsHebrew: Bool {
        let langs = (try? request().supportedRecognitionLanguages()) ?? []
        return langs.contains { $0.lowercased().hasPrefix("he") || $0.lowercased().hasPrefix("iw") }
    }

    static func recognize(_ image: UIImage, done: @escaping (String?, String) -> Void) {
        guard let cg = image.cgImage else { DispatchQueue.main.async { done(nil, "image") }; return }
        let orientation = CGImagePropertyOrientation(image.imageOrientation)
        DispatchQueue.global(qos: .userInitiated).async {
            let r = request()
            let langs = (try? r.supportedRecognitionLanguages()) ?? []
            let he = langs.filter { $0.lowercased().hasPrefix("he") || $0.lowercased().hasPrefix("iw") }
            r.recognitionLanguages = he + ["en-US"]
            do {
                try VNImageRequestHandler(cgImage: cg, orientation: orientation, options: [:]).perform([r])
            } catch {
                DispatchQueue.main.async { done(nil, error.localizedDescription) }
                return
            }
            // top to bottom; within a line, right to left (Hebrew)
            let obs = (r.results ?? []).sorted { a, b in
                abs(a.boundingBox.midY - b.boundingBox.midY) > 0.012 ? a.boundingBox.midY > b.boundingBox.midY : a.boundingBox.minX > b.boundingBox.minX
            }
            let text = obs.compactMap { $0.topCandidates(1).first?.string }.joined(separator: "\n")
            DispatchQueue.main.async { done(text, "ok") }
        }
    }
}

extension CGImagePropertyOrientation {
    init(_ o: UIImage.Orientation) {
        switch o {
        case .up: self = .up
        case .down: self = .down
        case .left: self = .left
        case .right: self = .right
        case .upMirrored: self = .upMirrored
        case .downMirrored: self = .downMirrored
        case .leftMirrored: self = .leftMirrored
        case .rightMirrored: self = .rightMirrored
        @unknown default: self = .up
        }
    }
}
