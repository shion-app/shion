use anyhow::anyhow;
use indexmap::IndexMap;
use serde_json::Value as JsonValue;
use sqlx::{Column, Row};
use tauri::State;
use tauri_plugin_sql::DbInstances;
use tokio::sync::{mpsc, oneshot, Mutex};

type RowsAffected = u64;
type LastInsertId = i64;

use super::{
    decode,
    error::{Error, Result},
};

async fn execute(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    query: String,
    values: Vec<JsonValue>,
) -> Result<(u64, LastInsertId)> {
    let mut query = sqlx::query(&query);
    for value in values {
        if value.is_null() {
            query = query.bind(None::<JsonValue>);
        } else if value.is_string() {
            query = query.bind(value.as_str().unwrap().to_owned())
        } else if let Some(number) = value.as_number() {
            query = query.bind(number.as_f64().unwrap_or_default())
        } else {
            query = query.bind(value);
        }
    }
    let result = query.execute(&mut **tx).await?;
    let r = Ok((result.rows_affected(), result.last_insert_rowid()));
    r
}

async fn select(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    query: String,
    values: Vec<JsonValue>,
) -> Result<Vec<IndexMap<String, JsonValue>>> {
    let mut query = sqlx::query(&query);
    for value in values {
        if value.is_null() {
            query = query.bind(None::<JsonValue>);
        } else if value.is_string() {
            query = query.bind(value.as_str().unwrap().to_owned())
        } else if let Some(number) = value.as_number() {
            query = query.bind(number.as_f64().unwrap_or_default())
        } else {
            query = query.bind(value);
        }
    }
    let rows = query.fetch_all(&mut **tx).await?;
    let mut values = Vec::new();
    for row in rows {
        let mut value = IndexMap::default();
        for (i, column) in row.columns().iter().enumerate() {
            let v = row.try_get_raw(i)?;

            let v = decode::to_json(v)?;

            value.insert(column.name().to_string(), v);
        }

        values.push(value);
    }

    Ok(values)
}

enum Action {
    Execute(String, Vec<JsonValue>),
    Select(String, Vec<JsonValue>),
    Commit,
    Rollback,
}

enum SqlData {
    Execute(RowsAffected, LastInsertId),
    Select(Vec<IndexMap<String, JsonValue>>),
    Null,
}

pub struct Transaction {
    sender: mpsc::Sender<(Action, oneshot::Sender<Result<SqlData>>)>,
    receiver: Mutex<mpsc::Receiver<(Action, oneshot::Sender<Result<SqlData>>)>>,
}

impl Transaction {
    pub fn new() -> Self {
        let (sender, receiver) = mpsc::channel(100);
        Self {
            sender,
            receiver: Mutex::new(receiver),
        }
    }

    async fn begin(&self, db_instances: State<'_, DbInstances>, db: String) -> Result<()> {
        let mut instances = db_instances.0.lock().await;
        let db = instances.get_mut(&db).ok_or(Error::DatabaseNotLoaded(db))?;
        let mut tx = db.begin().await?;

        while let Some((action, responder)) = self.receiver.lock().await.recv().await {
            match action {
                Action::Execute(query, values) => {
                    match execute(&mut tx, query, values).await {
                        Ok((rows, id)) => {
                            let _ = responder.send(Ok(SqlData::Execute(rows, id)));
                        }
                        Err(e) => {
                            let _ = responder.send(Err(anyhow!(e.to_string()).into()));
                            return Err(e);
                        }
                    };
                }
                Action::Select(query, values) => {
                    match select(&mut tx, query, values).await {
                        Ok(list) => {
                            let _ = responder.send(Ok(SqlData::Select(list)));
                        }
                        Err(e) => {
                            let _ = responder.send(Err(anyhow!(e.to_string()).into()));
                            return Err(e);
                        }
                    };
                }
                Action::Commit => {
                    let _ = responder.send(Ok(SqlData::Null));
                    break;
                }
                Action::Rollback => {
                    let _ = responder.send(Ok(SqlData::Null));
                    return Ok(tx.rollback().await?);
                }
            }
        }

        Ok(tx.commit().await?)
    }

    async fn execute(&self, query: String, values: Vec<JsonValue>) -> Result<SqlData> {
        let (tx, rx) = oneshot::channel();
        self.sender
            .send((Action::Execute(query, values), tx))
            .await
            .map_err(|e| anyhow!(e))?;
        Ok(rx.await.map_err(|e| anyhow!(e))??)
    }

    async fn select(&self, query: String, values: Vec<JsonValue>) -> Result<SqlData> {
        let (tx, rx) = oneshot::channel();
        self.sender
            .send((Action::Select(query, values), tx))
            .await
            .map_err(|e| anyhow!(e))?;
        Ok(rx.await.map_err(|e| anyhow!(e))??)
    }

    async fn commit(&self) -> Result<()> {
        let (tx, rx) = oneshot::channel();
        self.sender
            .send((Action::Commit, tx))
            .await
            .map_err(|e| anyhow!(e))?;
        rx.await.map_err(|e| anyhow!(e))??;
        Ok(())
    }

    async fn rollback(&self) -> Result<()> {
        let (tx, rx) = oneshot::channel();
        self.sender
            .send((Action::Rollback, tx))
            .await
            .map_err(|e| anyhow!(e))?;
        rx.await.map_err(|e| anyhow!(e))??;
        Ok(())
    }
}

#[tauri::command]
pub async fn begin_transaction(
    db_instances: State<'_, DbInstances>,
    transaction: State<'_, Transaction>,
    db: String,
) -> Result<()> {
    transaction.begin(db_instances, db).await?;
    Ok(())
}

#[tauri::command]
pub async fn execute_transaction(
    transaction: State<'_, Transaction>,
    query: String,
    values: Vec<JsonValue>,
) -> Result<(RowsAffected, LastInsertId)> {
    if let SqlData::Execute(rows, id) = transaction.execute(query, values).await? {
        return Ok((rows, id));
    }
    Ok((0, 0))
}

#[tauri::command]
pub async fn select_transaction(
    transaction: State<'_, Transaction>,
    query: String,
    values: Vec<JsonValue>,
) -> Result<Vec<IndexMap<String, JsonValue>>> {
    if let SqlData::Select(list) = transaction.select(query, values).await? {
        return Ok(list);
    }
    Ok(vec![])
}

#[tauri::command]
pub async fn commit_transaction(transaction: State<'_, Transaction>) -> Result<()> {
    transaction.commit().await
}

#[tauri::command]
pub async fn rollback_transaction(transaction: State<'_, Transaction>) -> Result<()> {
    transaction.rollback().await
}
