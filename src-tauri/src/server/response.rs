#[macro_export]
macro_rules! success {
    ( $( $name:ident ),* ) => {
        {
            #[allow(unused_mut)]
            let mut map = serde_json::Map::new();
            $(
                map.insert(stringify!($name).to_string(), serde_json::json!($name));
            )*
            if map.len() == 0 {
                Ok(actix_web::web::Json(serde_json::json!({ "success": true })))
            } else {
                let data = serde_json::Value::Object(map);
                Ok(actix_web::web::Json(serde_json::json!({ "success": true, "data": data  })))
            }
        }
    };
}
