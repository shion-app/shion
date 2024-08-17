use std::future::{ready, Ready};

use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage,
};
use futures_util::future::LocalBoxFuture;

use crate::server::{error::CustomError, token::validate_jwt};

// There are two steps in middleware processing.
// 1. Middleware initialization, middleware factory gets called with
//    next service in chain as parameter.
// 2. Middleware's call method gets called with normal request.
pub struct Auth {
    pub secret: String,
    pub allows: Vec<String>,
}

// Middleware factory is `Transform` trait
// `S` - type of the next service
// `B` - type of response's body
impl<S, B> Transform<S, ServiceRequest> for Auth
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = AuthMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthMiddleware {
            service,
            secret: self.secret.clone(),
            allows: self.allows.clone(),
        }))
    }
}

pub struct AuthMiddleware<S> {
    service: S,
    secret: String,
    allows: Vec<String>,
}

impl<S, B> Service<ServiceRequest> for AuthMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let path = req.path().to_string();
        if self.allows.contains(&path) {
            let fut = self.service.call(req);
            return Box::pin(async move { fut.await });
        }

        let auth_header = req
            .headers()
            .get("Authorization")
            .and_then(|h| h.to_str().ok());

        if let Some(auth_header) = auth_header {
            if auth_header.starts_with("Bearer ") {
                let token = &auth_header[7..];
                if let Ok(claims) = validate_jwt(token, &self.secret) {
                    req.extensions_mut().insert(claims);
                    let fut = self.service.call(req);
                    return Box::pin(async move { fut.await });
                } else {
                    return Box::pin(async move { Err(CustomError::Unauthorized.into()) });
                }
            }
        }

        Box::pin(async move {
            Err(CustomError::BadRequest {
                message: "token not found".to_string(),
            }
            .into())
        })
    }
}
