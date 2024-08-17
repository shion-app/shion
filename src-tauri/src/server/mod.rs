use std::sync::Mutex;

use actix_cors::Cors;
use actix_web::{
    dev::ServerHandle,
    middleware::{self, from_fn},
    web, App, HttpServer,
};
use dotenv_codegen::dotenv;
use lazy_static::lazy_static;
use tauri::AppHandle;

mod error;
mod handler;
mod middlewares;
mod response;
mod token;

use middlewares::{auth::Auth, global_error::error_handler, not_found::not_found};

lazy_static! {
    static ref APP_ROUTES: Vec<String> = vec!["/auth", "/stop", "/ping", "/remark/create"]
        .iter()
        .map(|route| "/api".to_string() + route)
        .collect();
}

pub struct AppState {
    app: Mutex<AppHandle>,
    secret: Mutex<String>,
}

#[actix_web::main]
pub async fn init(app: AppHandle, port: u16) -> std::io::Result<()> {
    let secret = dotenv!("JWT_SECRET").to_string();

    let tauri_app = web::Data::new(AppState {
        app: Mutex::new(app),
        secret: Mutex::new(secret.clone()),
    });

    let stop_handle = web::Data::new(StopHandle::default());

    let server = HttpServer::new({
        let stop_handle = stop_handle.clone();
        move || {
            App::new()
                .app_data(tauri_app.clone())
                .app_data(stop_handle.clone())
                .wrap(middleware::Logger::default())
                .wrap(error_handler())
                .wrap(Auth {
                    secret: secret.clone(),
                    allows: vec![
                        "/api/auth".to_string(),
                        "/api/stop".to_string(),
                        "/api/ping".to_string(),
                    ],
                })
                .wrap(from_fn(not_found))
                .wrap(Cors::permissive())
                .service(
                    web::scope("/api")
                        .service(handler::auth)
                        .service(handler::create_remark)
                        .service(handler::stop)
                        .service(handler::ping),
                )
        }
    })
    .disable_signals()
    .bind(("127.0.0.1", port))?
    .run();

    stop_handle.register(server.handle());

    server.await
}

#[derive(Default)]
struct StopHandle {
    inner: Mutex<Option<ServerHandle>>,
}

impl StopHandle {
    /// Sets the server handle to stop.
    fn register(&self, handle: ServerHandle) {
        *self.inner.lock().unwrap() = Some(handle);
    }

    /// Sends stop signal through contained server handle.
    async fn stop(&self, graceful: bool) {
        #[allow(clippy::let_underscore_future)]
        let inner = self.inner.lock();
        let _ = inner.unwrap().as_ref().unwrap().stop(graceful).await;
    }
}
