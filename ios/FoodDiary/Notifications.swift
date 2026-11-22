import Foundation
import UserNotifications

/// Reminders. iOS cannot check the diary at the moment a reminder fires, so they are planned ahead
/// and re-planned every time the page reports what was logged or drunk.
enum Notifications {
    static let restCategory = "REST"
    static let waterCategory = "WATER"
    static let addGlassAction = "ADD_GLASS"
    static var authorized = false

    private static let d = UserDefaults.standard
    private static let center = UNUserNotificationCenter.current()
    private static var en: Bool { d.string(forKey: "lang") == "en" }

    private static func int(_ k: String, _ def: Int) -> Int { d.object(forKey: k) == nil ? def : d.integer(forKey: k) }

    static func registerCategories() {
        let cup = int("w_cup", 250)
        let add = UNNotificationAction(identifier: addGlassAction, title: en ? "I drank a glass (\(cup) ml)" : "שתיתי כוס (\(cup) מ\"ל)", options: [])
        let water = UNNotificationCategory(identifier: waterCategory, actions: [add], intentIdentifiers: [], options: [])
        let rest = UNNotificationCategory(identifier: restCategory, actions: [], intentIdentifiers: [], options: [])
        center.setNotificationCategories([water, rest])
        refreshAuth()
    }

    static func refreshAuth() {
        center.getNotificationSettings { s in
            authorized = s.authorizationStatus == .authorized || s.authorizationStatus == .provisional
        }
    }

    static func requestPermission(_ done: @escaping (Bool) -> Void) {
        center.requestAuthorization(options: [.alert, .sound, .badge]) { ok, _ in
            authorized = ok
            if ok { rescheduleAll() }
            DispatchQueue.main.async { done(ok) }
        }
    }

    static func rescheduleAll() {
        registerCategories()
        scheduleMeal()
        scheduleWater()
    }

    static func isoDay(_ date: Date) -> String {
        let c = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }
    private static func hhmm(_ date: Date) -> String {
        let c = Calendar.current.dateComponents([.hour, .minute], from: date)
        return String(format: "%02d:%02d", c.hour ?? 0, c.minute ?? 0)
    }
    private static func litres(_ ml: Int) -> String {
        let l = (Double(ml) / 10).rounded() / 100
        return l == l.rounded() ? String(Int(l)) : String(l)
    }

    // MARK: daily "did you log?" reminder

    static func setMealReminder(on: Bool, h: Int, m: Int) {
        d.set(on, forKey: "rem_on"); d.set(h, forKey: "rem_h"); d.set(m, forKey: "rem_m")
        scheduleMeal()
    }

    static func setDayStatus(date: String, meals: Int) {
        let changed = d.string(forKey: "status_date") != date || d.integer(forKey: "status_meals") != meals
        d.set(date, forKey: "status_date"); d.set(meals, forKey: "status_meals")
        if changed { scheduleMeal() }
    }

    static func scheduleMeal() {
        center.removePendingNotificationRequests(withIdentifiers: (0..<8).map { "meal-\($0)" })
        guard d.bool(forKey: "rem_on") else { return }
        let h = int("rem_h", 21), mi = int("rem_m", 0)
        let cal = Calendar.current
        let now = Date()
        let mealsToday = d.string(forKey: "status_date") == isoDay(now) ? d.integer(forKey: "status_meals") : 0
        for i in 0..<7 {
            guard let day = cal.date(byAdding: .day, value: i, to: now) else { continue }
            var dc = cal.dateComponents([.year, .month, .day], from: day)
            dc.hour = h; dc.minute = mi
            guard let fire = cal.date(from: dc), fire > now.addingTimeInterval(5) else { continue }
            let meals = i == 0 ? mealsToday : 0
            if meals >= 4 { continue }
            let c = UNMutableNotificationContent()
            c.title = en ? "Food Diary" : "יומן אוכל"
            c.body = meals == 0
                ? (en ? "You haven't logged what you ate today" : "עוד לא רשמת מה אכלת היום")
                : (en ? "You logged \(meals) of 4 meals today. Want to finish?" : "רשמת \(meals) מתוך 4 ארוחות היום. רוצה להשלים?")
            c.sound = .default
            center.add(UNNotificationRequest(identifier: "meal-\(i)", content: c, trigger: UNCalendarNotificationTrigger(dateMatching: dc, repeats: false)))
        }
    }

    // MARK: water

    static func setWaterStatus(date: String, ml: Int, goal: Int, cup: Int) {
        let cupChanged = int("w_cup", 250) != cup
        d.set(date, forKey: "w_date"); d.set(ml, forKey: "w_ml"); d.set(goal, forKey: "w_goal"); d.set(cup, forKey: "w_cup")
        if cupChanged { registerCategories() }
        scheduleWater()
    }

    static func setWaterReminder(on: Bool, wake: Int, sleep: Int, every: Int) {
        d.set(on, forKey: "wr_on"); d.set(wake, forKey: "wr_wake"); d.set(sleep, forKey: "wr_sleep"); d.set(every, forKey: "wr_every")
        scheduleWater()
    }

    /// Today: only the times when you would be behind an even pace (given what you drank so far).
    /// The next two days: every slot, re-planned as soon as the app is opened.
    static func scheduleWater() {
        center.getPendingNotificationRequests { reqs in
            let old = reqs.map { $0.identifier }.filter { $0.hasPrefix("water-") }
            center.removePendingNotificationRequests(withIdentifiers: old)
            guard d.bool(forKey: "wr_on") else { return }
            let wake = int("wr_wake", 7 * 60), sleep = int("wr_sleep", 23 * 60)
            let every = max(30, min(360, int("wr_every", 120)))
            let goal = int("w_goal", 2500), cup = int("w_cup", 250)
            let now = Date()
            let ml = d.string(forKey: "w_date") == isoDay(now) ? d.integer(forKey: "w_ml") : 0
            let cal = Calendar.current
            var count = 0
            for dayOffset in 0..<3 {
                guard let day = cal.date(byAdding: .day, value: dayOffset, to: now) else { continue }
                var t = wake + 90
                while t <= sleep && count < 40 {
                    let slot = t
                    t += every
                    var dc = cal.dateComponents([.year, .month, .day], from: day)
                    dc.hour = min(23, slot / 60); dc.minute = slot % 60
                    guard let fire = cal.date(from: dc), fire > now.addingTimeInterval(60) else { continue }
                    let frac = min(1, max(0, Double(slot - wake) / Double(max(60, sleep - wake))))
                    let expected = Int(Double(goal) * frac)
                    let c = UNMutableNotificationContent()
                    c.title = en ? "Time for some water" : "הגיע הזמן לשתות"
                    if dayOffset == 0 {
                        if ml >= goal || expected - ml <= max(150, Int(Double(cup) * 0.6)) { continue }
                        c.body = en ? "You've had \(litres(ml)) of \(litres(goal)) L. By now you'd be at about \(litres(expected)) L."
                            : "שתית \(litres(ml)) מתוך \(litres(goal)) ליטר. לפי השעה כדאי להיות בערך ב-\(litres(expected))."
                    } else {
                        c.body = en ? "A glass now keeps you on pace for \(litres(goal)) L today." : "כוס מים עכשיו תשמור אותך בקצב ליעד של \(litres(goal)) ליטר."
                    }
                    c.sound = .default
                    c.categoryIdentifier = waterCategory
                    center.add(UNNotificationRequest(identifier: "water-\(dayOffset)-\(slot)", content: c,
                                                     trigger: UNCalendarNotificationTrigger(dateMatching: dc, repeats: false)))
                    count += 1
                }
            }
        }
    }

    /// From the notification button: remember the glass until the page picks it up.
    static func addGlass() {
        let cup = int("w_cup", 250)
        let now = Date()
        let today = isoDay(now)
        var list: [[String: Any]] = []
        if let s = d.string(forKey: "w_pending"), let data = s.data(using: .utf8),
           let arr = (try? JSONSerialization.jsonObject(with: data)) as? [[String: Any]] { list = arr }
        list.append(["d": today, "t": hhmm(now), "ml": cup])
        if let out = try? JSONSerialization.data(withJSONObject: list), let s = String(data: out, encoding: .utf8) { d.set(s, forKey: "w_pending") }
        let ml = (d.string(forKey: "w_date") == today ? d.integer(forKey: "w_ml") : 0) + cup
        d.set(today, forKey: "w_date"); d.set(ml, forKey: "w_ml")
        scheduleWater()
    }

    static func takePending() -> String {
        let s = d.string(forKey: "w_pending") ?? "[]"
        d.set("[]", forKey: "w_pending")
        return s
    }

    // MARK: rest timer between sets

    static func restStart(seconds: Int, title: String, text: String) {
        center.removePendingNotificationRequests(withIdentifiers: ["rest"])
        let c = UNMutableNotificationContent()
        c.title = title
        c.body = text
        c.sound = .default
        c.categoryIdentifier = restCategory
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: TimeInterval(max(5, min(900, seconds))), repeats: false)
        center.add(UNNotificationRequest(identifier: "rest", content: c, trigger: trigger))
    }

    static func restCancel() {
        center.removePendingNotificationRequests(withIdentifiers: ["rest"])
        center.removeDeliveredNotifications(withIdentifiers: ["rest"])
    }
}
