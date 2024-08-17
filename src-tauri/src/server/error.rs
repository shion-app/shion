use actix_web::{error::ResponseError, http::StatusCode, HttpResponse};
use derive_more::{Display, Error};
use serde_json::json;

#[derive(Debug, Display, Error)]
pub enum CustomError {
    #[display("{message}")]
    BadRequest { message: String },

    #[display("invalid token")]
    Unauthorized,

    #[display("{message}")]
    Database { message: String },

    #[display("not found")]
    NotFound,
}

impl ResponseError for CustomError {
    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status_code()).json(json!({
            "success": false,
            "message": self.to_string()
        }))
    }

    fn status_code(&self) -> StatusCode {
        match *self {
            CustomError::BadRequest { .. } => StatusCode::BAD_REQUEST,
            CustomError::Unauthorized => StatusCode::UNAUTHORIZED,
            CustomError::Database { .. } => StatusCode::INTERNAL_SERVER_ERROR,
            CustomError::NotFound => StatusCode::NOT_FOUND,
        }
    }
}
