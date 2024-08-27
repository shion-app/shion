use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter,
};
use tauri_plugin_shion_sql::Result;

use super::models::{prelude::*, program, remark};

pub struct InsertRemark {
    pub title: String,
    pub desc: String,
    pub arg: String,
    pub program_id: i64,
    pub time: i64,
}

pub async fn create_remark(db: &DatabaseConnection, data: InsertRemark) -> Result<()> {
    let model = remark::ActiveModel {
        title: Set(data.title),
        desc: Set(data.desc),
        arg: Set(data.arg),
        program_id: Set(data.program_id),
        time: Set(data.time),
        ..Default::default()
    };
    model.insert(db).await?;
    Ok(())
}

pub async fn select_program_list(db: &DatabaseConnection) -> Result<Vec<program::Model>> {
    Ok(Program::find()
        .filter(program::Column::DeletedAt.eq(0))
        .all(db)
        .await?)
}
