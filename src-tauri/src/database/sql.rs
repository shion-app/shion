use sea_orm::{
    prelude::Expr, ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection,
    EntityTrait, FromQueryResult, JoinType::LeftJoin, QueryFilter, QuerySelect, RelationTrait,
};
use tauri_plugin_shion_sql::Result;

use super::models::{activity, label, note, prelude::*, program, remark};

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

#[derive(FromQueryResult)]
pub struct DailyStatusResult {
    pub name: String,
    pub color: String,
    pub key: String,
    pub start: i64,
    pub end: i64,
}

pub async fn select_note_for_daily_status(
    db: &DatabaseConnection,
    start: i64,
    end: i64,
) -> Result<Vec<DailyStatusResult>> {
    Ok(Note::find()
        .select_only()
        .column(note::Column::Start)
        .column(note::Column::End)
        .column(label::Column::Name)
        .column(label::Column::Color)
        .column_as(Expr::cust("CONCAT('label_', label.id)"), "key")
        .join(LeftJoin, note::Relation::Label.def())
        .filter(note::Column::DeletedAt.eq(0))
        .filter(note::Column::Start.gt(start))
        .filter(note::Column::End.lt(end))
        .filter(label::Column::DeletedAt.eq(0))
        .into_model::<DailyStatusResult>()
        .all(db)
        .await?)
}

pub async fn select_activity_for_daily_status(
    db: &DatabaseConnection,
    start: i64,
    end: i64,
) -> Result<Vec<DailyStatusResult>> {
    Ok(Activity::find()
        .select_only()
        .column(activity::Column::Start)
        .column(activity::Column::End)
        .column(program::Column::Name)
        .column(program::Column::Color)
        .column_as(Expr::cust("CONCAT('program_', program.id)"), "key")
        .join(LeftJoin, activity::Relation::Program.def())
        .filter(activity::Column::DeletedAt.eq(0))
        .filter(activity::Column::Start.gt(start))
        .filter(activity::Column::End.lt(end))
        .filter(program::Column::DeletedAt.eq(0))
        .into_model::<DailyStatusResult>()
        .all(db)
        .await?)
}
