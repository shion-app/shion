use std::{
    fs::{read_dir, read_to_string},
    path::Path,
    time::UNIX_EPOCH,
};

use anyhow::anyhow;
use chrono::{DateTime, Utc};
use gray_matter::{engine::YAML, Matter, Pod};
use serde::Serialize;

use crate::Result;

#[derive(Serialize)]
pub struct ObsidianNote {
    name: String,
    path: String,
    created: i64,
    updated: i64,
}

pub fn read_obsidian<P>(
    path: P,
    created_key: String,
    updated_key: String,
) -> Result<Vec<ObsidianNote>>
where
    P: AsRef<Path>,
{
    let mut list = vec![];
    for entry in read_dir(path)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            list.append(&mut read_obsidian(
                path,
                created_key.clone(),
                updated_key.clone(),
            )?);
        } else if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext == "md" {
                    let content = read_to_string(path.clone())?;
                    let matter = Matter::<YAML>::new();
                    let name = path
                        .file_stem()
                        .ok_or(anyhow!("file_stem error"))?
                        .to_str()
                        .ok_or(anyhow!("file_stem to_str error"))?
                        .to_string();
                    let path = path.to_str().ok_or(anyhow!("invalid path"))?.to_string();
                    let metadata = entry.metadata()?;

                    let mut created =
                        metadata.created()?.duration_since(UNIX_EPOCH)?.as_millis() as i64;
                    let mut updated =
                        metadata.modified()?.duration_since(UNIX_EPOCH)?.as_millis() as i64;

                    if let Some(frontmatter) = matter.parse(&content).data {
                        if let Pod::Hash(frontmatter) = frontmatter {
                            if let Some(value) = frontmatter.get(&created_key.clone()) {
                                if let Ok(value) = value.as_string() {
                                    if let Ok(time) = value.parse::<DateTime<Utc>>() {
                                        created = time.timestamp_millis();
                                    }
                                }
                            }
                            if let Some(value) = frontmatter.get(&updated_key.clone()) {
                                if let Ok(value) = value.as_string() {
                                    if let Ok(time) = value.parse::<DateTime<Utc>>() {
                                        updated = time.timestamp_millis();
                                    }
                                }
                            }
                        }
                    }
                    list.push(ObsidianNote {
                        name,
                        path,
                        created,
                        updated,
                    })
                }
            }
        }
    }
    Ok(list)
}
