use actix_web::{
    body::MessageBody,
    dev::{ServiceRequest, ServiceResponse},
    middleware::Next,
};

use crate::server::{error::CustomError, APP_ROUTES};

pub async fn not_found(
    req: ServiceRequest,
    next: Next<impl MessageBody>,
) -> actix_web::Result<ServiceResponse<impl MessageBody>> {
    let path = req.path().to_string();

    if !APP_ROUTES.contains(&path) {
        return Err(CustomError::NotFound.into());
    }

    let res = next.call(req).await?;

    Ok(res)
}
