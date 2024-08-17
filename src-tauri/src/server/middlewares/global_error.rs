use actix_web::{
    dev::ServiceResponse,
    middleware::{ErrorHandlerResponse, ErrorHandlers},
    HttpResponse,
};
use serde_json::json;

pub fn error_handler<B>() -> ErrorHandlers<B> {
    ErrorHandlers::new().default_handler(|res: ServiceResponse<B>| {
        let req = res.request();
        let message = res.response().error().map(|e| e.to_string());
        let res = HttpResponse::build(res.status())
            .json(json!({
                "success": false,
                "message": message
            }))
            .map_into_right_body();
        let res = ServiceResponse::new(req.clone(), res);
        Ok(ErrorHandlerResponse::Response(res))
    })
}
