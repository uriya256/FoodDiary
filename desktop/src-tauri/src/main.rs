// FoodDiary for Windows: the same web app as the phone, in a window (WebView2).
// The only native part is the manufacturer's site window, which reads a product's
// nutrition table with the app's own extract.js.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};

/// The page reader shared with the Android app.
const EXTRACT: &str = include_str!("../../../app/src/main/assets/www/extract.js");
/// The site window "navigates" here to hand over what it read; the navigation is cancelled.
const VALUES_HOST: &str = "fooddiary-app.invalid";

/// The `(function () { ... })()` expression inside extract.js.
fn extract_expr() -> &'static str {
    let start = EXTRACT.find("(function").unwrap_or(0);
    let end = EXTRACT.rfind("})()").map(|i| i + 4).unwrap_or(EXTRACT.len());
    &EXTRACT[start..end]
}

/// Runs in every page of the site window: a button that reads the values, and a place for short messages.
fn page_script(he: bool) -> String {
    let label = if he { "קח את הערכים מהדף" } else { "Use the values on this page" };
    let script = r#"
window.__fdExtract = function () { return __EXPR__; };
(function () {
  function add() {
    if (!document.body || document.getElementById('__fd_take')) return;
    var b = document.createElement('button');
    b.id = '__fd_take';
    b.type = 'button';
    b.textContent = __LABEL__;
    b.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483647;height:52px;border:0;border-radius:14px;' +
      'background:#04845C;color:#fff;font:bold 17px "Segoe UI",system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer';
    b.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var r;
      try { r = window.__fdExtract(); } catch (x) { r = JSON.stringify({ ok: false, err: String(x) }); }
      location.href = 'https://__HOST__/values?d=' + encodeURIComponent(r || '{"ok":false}');
    }, true);
    document.body.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
  setInterval(add, 1500);
  // links that would open a new window open here
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[target]') : null;
    if (a && a.target !== '_self') a.target = '_self';
  }, true);
  window.__fdNote = function (t) {
    var n = document.getElementById('__fd_note');
    if (!n) {
      n = document.createElement('div');
      n.id = '__fd_note';
      n.style.cssText = 'position:fixed;left:24px;right:24px;bottom:84px;z-index:2147483647;padding:12px 16px;border-radius:12px;' +
        'background:rgba(25,28,24,.94);color:#fff;font:15px "Segoe UI",system-ui,sans-serif;text-align:center;direction:rtl';
      document.body.appendChild(n);
    }
    n.textContent = t;
    n.style.display = 'block';
    clearTimeout(window.__fdNoteT);
    window.__fdNoteT = setTimeout(function () { n.style.display = 'none'; }, 5000);
  };
})();
"#;
    script
        .replace("__EXPR__", extract_expr())
        .replace("__LABEL__", &serde_json::to_string(label).unwrap_or_else(|_| "\"\"".into()))
        .replace("__HOST__", VALUES_HOST)
}

fn main_eval(app: &AppHandle, code: &str) {
    if let Some(m) = app.get_webview_window("main") {
        let _ = m.eval(code);
    }
}

/// Opens (or reuses) the window with the manufacturer's site.
#[tauri::command]
async fn open_web(app: AppHandle, url: String, lang: String) -> Result<(), String> {
    let he = lang != "en";
    let target = url.parse::<tauri::Url>().map_err(|e| e.to_string())?;
    if let Some(w) = app.get_webview_window("web") {
        w.navigate(target).map_err(|e| e.to_string())?;
        let _ = w.set_focus();
        return Ok(());
    }
    let handle = app.clone();
    let w = WebviewWindowBuilder::new(&app, "web", WebviewUrl::External(target))
        .title(if he { "אתר היצרן" } else { "Maker's site" })
        .inner_size(1000.0, 820.0)
        .initialization_script(&page_script(he))
        .on_navigation(move |u| {
            if u.host_str() == Some(VALUES_HOST) {
                let d = u
                    .query_pairs()
                    .find(|(k, _)| k == "d")
                    .map(|(_, v)| v.into_owned())
                    .unwrap_or_default();
                let lit = serde_json::to_string(&d).unwrap_or_else(|_| "\"\"".into());
                main_eval(&handle, &format!("window.onWebValues && window.onWebValues({lit})"));
                return false;
            }
            true
        })
        .build()
        .map_err(|e| e.to_string())?;
    let h2 = app.clone();
    w.on_window_event(move |e| {
        if let WindowEvent::Destroyed = e {
            main_eval(&h2, "window.onWebClosed && window.onWebClosed()");
        }
    });
    Ok(())
}

#[tauri::command]
async fn close_web(app: AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("web") {
        w.close().map_err(|e| e.to_string())?;
    }
    if let Some(m) = app.get_webview_window("main") {
        let _ = m.set_focus();
    }
    Ok(())
}

#[tauri::command]
async fn web_message(app: AppHandle, text: String) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("web") {
        let lit = serde_json::to_string(&text).unwrap_or_else(|_| "\"\"".into());
        w.eval(&format!("window.__fdNote && window.__fdNote({lit})")).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_web, close_web, web_message])
        // closing the app's window closes the site window too
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let WindowEvent::Destroyed = event {
                    window.app_handle().exit(0);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("FoodDiary could not start");
}
