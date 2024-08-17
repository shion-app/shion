use sqlx::{query, Pool, Sqlite};

pub struct InsertRemark {
    pub title: String,
    pub desc: String,
    pub arg: String,
    pub program_id: i64,
    pub time: i64,
}

#[derive(sqlx::FromRow)]
pub struct Program {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub path: String,
    pub icon: String,
    pub platform: String,
    pub sort: i64,
    pub deleted_at: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

pub async fn create_remark(db: &Pool<Sqlite>, remark: InsertRemark) -> sqlx::Result<()> {
    query("INSERT INTO remark (title, desc, arg, program_id, time) VALUES (?, ?, ?, ?, ?)")
        .bind(remark.title)
        .bind(remark.desc)
        .bind(remark.arg)
        .bind(remark.program_id)
        .bind(remark.time)
        .execute(db)
        .await?;
    Ok(())
}

pub async fn select_program_list(db: &Pool<Sqlite>) -> sqlx::Result<Vec<Program>> {
    sqlx::query_as::<_, Program>("SELECT * FROM program WHERE deleted_at = 0")
        .fetch_all(db)
        .await
}
