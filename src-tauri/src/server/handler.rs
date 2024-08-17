use std::path::PathBuf;

use actix_web::{get, post, web, Responder};
use chrono::Utc;
use futures_util::TryFutureExt;
use path_slash::PathBufExt;
use serde::{Deserialize, Serialize};

use crate::{
    database::sql::{self, InsertRemark},
    get_db,
    server::{
        error::CustomError,
        token::{create_jwt, Claims},
        AppState, StopHandle,
    },
    success,
};

#[derive(Deserialize, Serialize, Clone)]
struct AuthRequest {
    path: String,
}

#[post("/auth")]
pub async fn auth(
    request: web::Json<AuthRequest>,
    app_state: web::Data<AppState>,
) -> actix_web::Result<impl Responder> {
    let app_handle = app_state.app.lock().unwrap();
    let secret = app_state.secret.lock().unwrap();
    let db = get_db(&app_handle).await;
    let path = request.path.clone();
    let program_list = sql::select_program_list(&db)
        .await
        .map_err(|e| CustomError::Database {
            message: e.to_string(),
        })?;
    let program = program_list
        .iter()
        .find(|p| PathBuf::from_slash(&p.path) == PathBuf::from_slash(&path))
        .ok_or(CustomError::BadRequest {
            message: "this path cannot be authorized".to_string(),
        })?;
    let token = create_jwt(&secret, program.id);
    success!(token)
}

#[derive(Deserialize, Serialize)]
struct CreateRemarkRequest {
    title: String,
    desc: String,
    arg: Option<String>,
    time: Option<i64>,
}

#[post("/remark/create")]
pub async fn create_remark(
    request: web::Json<CreateRemarkRequest>,
    app_state: web::Data<AppState>,
    claims: web::ReqData<Claims>,
) -> actix_web::Result<impl Responder> {
    let id = claims.sub;
    let remark = InsertRemark {
        title: request.title.clone(),
        desc: request.desc.clone(),
        arg: request.arg.clone().unwrap_or("".to_string()),
        program_id: id,
        time: request.time.unwrap_or(Utc::now().timestamp_millis()),
    };
    let app_handle = app_state.app.lock().unwrap();
    let db = get_db(&app_handle).await;
    sql::create_remark(&db, remark)
        .map_err(|e| CustomError::Database {
            message: e.to_string(),
        })
        .await?;
    success!()
}

#[post("/stop")]
pub async fn stop(stop_handle: web::Data<StopHandle>) -> actix_web::Result<impl Responder> {
    stop_handle.stop(false).await;
    success!()
}

#[get("/ping")]
pub async fn ping() -> actix_web::Result<impl Responder> {
    success!()
}
