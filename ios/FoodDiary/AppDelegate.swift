import UIKit
import UserNotifications

@main
final class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        Notifications.registerCategories()
        return true
    }

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let c = UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
        c.delegateClass = SceneDelegate.self
        return c
    }

    /// While the app is open: the rest timer only buzzes (the page shows its own message); others show a banner.
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        if notification.request.content.categoryIdentifier == Notifications.restCategory {
            Haptics.buzz(long: true)
            completionHandler([])
            return
        }
        completionHandler([.banner, .list, .sound])
    }

    /// The "I drank a glass" button on a water reminder logs a glass without opening the app.
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        if response.actionIdentifier == Notifications.addGlassAction {
            Notifications.addGlass()
            WebViewController.current?.js("window.pullPendingWater && window.pullPendingWater() && window.render && render({ keepScroll: true })")
        }
        completionHandler()
    }
}

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let ws = scene as? UIWindowScene else { return }
        let w = UIWindow(windowScene: ws)
        w.rootViewController = WebViewController()
        w.makeKeyAndVisible()
        window = w
    }

    func sceneDidEnterBackground(_ scene: UIScene) { WebViewController.current?.appPause() }
    func sceneWillEnterForeground(_ scene: UIScene) { Notifications.refreshAuth() }
}

enum Haptics {
    static func buzz(long: Bool) {
        DispatchQueue.main.async {
            if long {
                UINotificationFeedbackGenerator().notificationOccurred(.warning)
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { UINotificationFeedbackGenerator().notificationOccurred(.success) }
            } else {
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
            }
        }
    }
}

/// A copy of the diary kept as a file, so the data survives even if the web storage is cleared.
enum Backup {
    static var url: URL {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("autobackup.json")
    }
    static func write(_ s: String) {
        guard s.count > 10 else { return }
        DispatchQueue.global(qos: .utility).async { try? s.data(using: .utf8)?.write(to: url, options: .atomic) }
    }
    static func read() -> String { (try? String(contentsOf: url, encoding: .utf8)) ?? "" }
}

/// A Swift string as a JavaScript string literal.
func jsq(_ s: String) -> String {
    if let d = try? JSONSerialization.data(withJSONObject: s, options: [.fragmentsAllowed]), let t = String(data: d, encoding: .utf8) { return t }
    return "\"\""
}
