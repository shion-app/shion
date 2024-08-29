use std::collections::HashMap;

use anyhow::anyhow;
use chrono::{Duration, Local, TimeZone};
use futures_util::try_join;
use now::DateTimeNow;
use sea_orm::DatabaseConnection;
use serde::Serialize;
use tauri_plugin_shion_sql::Result;

use crate::database::sql::DailyStatusResult;

use super::sql;

#[derive(Serialize, Clone)]
pub struct DailyStatus {
    total: i64,
    list: Vec<DailyStatusItem>,
}

#[derive(Serialize, Clone)]
pub struct DailyStatusItem {
    total: i64,
    key: String,
    name: String,
    color: String,
}
pub async fn get_active_status_calendar_map(
    db: &DatabaseConnection,
    start: i64,
    end: i64,
) -> Result<HashMap<String, DailyStatus>> {
    let (note_list, activity_list) = try_join!(
        sql::select_note_for_daily_status(db, start, end),
        sql::select_activity_for_daily_status(db, start, end)
    )?;

    let mut map = HashMap::new();

    let mut insert = |timestamp: i64, name: String, color: String, key: String, spend: i64| {
        let date = Local
            .timestamp_millis_opt(timestamp)
            .unwrap()
            .format("%Y-%m-%d")
            .to_string();
        let total = map
            .get(&date)
            .map(|status: &DailyStatus| status.total)
            .unwrap_or(0);
        let mut list = map
            .get(&date)
            .map(|status: &DailyStatus| status.list.clone())
            .unwrap_or(vec![]);
        let index = list.iter().position(|i| i.key == key);
        if let Some(index) = index {
            list[index].total += spend
        } else {
            list.push(DailyStatusItem {
                key,
                total: spend,
                name,
                color,
            })
        }
        map.insert(
            date,
            DailyStatus {
                total: total + spend,
                list,
            },
        );
    };

    let list = note_list.into_iter().chain(activity_list).collect();

    let list = split_by_day(list, (start, end))?;

    for item in list {
        let DailyStatusResult {
            name,
            color,
            key,
            start,
            end,
        } = item;
        insert(start, name, color, key, end - start);
    }

    Ok(map)
}

fn split_by_day(list: Vec<DailyStatusResult>, range: (i64, i64)) -> Result<Vec<DailyStatusResult>> {
    let mut result = Vec::new();
    let (start_date, end_date) = range;

    for DailyStatusResult {
        start,
        end,
        name,
        color,
        key,
    } in list
    {
        let mut _start = start.max(start_date);

        let mut time_list = vec![_start];

        _start = Local
            .timestamp_millis_opt(_start)
            .single()
            .ok_or(anyhow!("invalid timestamp"))?
            .beginning_of_day()
            .timestamp_millis()
            + Duration::days(1).num_milliseconds();

        while end > _start {
            time_list.push(_start);
            _start += Duration::days(1).num_milliseconds();
        }

        time_list.push(end.min(end_date));

        for i in 0..time_list.len() - 1 {
            result.push(DailyStatusResult {
                start: time_list[i],
                end: time_list[i + 1],
                name: name.clone(),
                color: color.clone(),
                key: key.clone(),
            });
        }
    }

    Ok(result)
}
