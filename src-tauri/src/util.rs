use std::{
    fs::{read_dir, read_to_string},
    path::Path,
    time::UNIX_EPOCH,
};

use anyhow::anyhow;
use chrono::DateTime;
use gray_matter::{engine::YAML, Matter, Pod};
use serde::Serialize;

use crate::Result;

#[derive(Serialize)]
pub struct ObsidianNote {
    name: String,
    path: String,
    created: String,
    updated: String,
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
                    let file_created =
                        metadata.created()?.duration_since(UNIX_EPOCH)?.as_millis() as i64;
                    let file_updated =
                        metadata.modified()?.duration_since(UNIX_EPOCH)?.as_millis() as i64;

                    let mut created = DateTime::from_timestamp_millis(file_created)
                        .ok_or(anyhow!("timestamp error"))?
                        .format("%Y-%m-%d %H:%M:%S")
                        .to_string();

                    let mut updated = DateTime::from_timestamp_millis(file_updated)
                        .ok_or(anyhow!("timestamp error"))?
                        .format("%Y-%m-%d %H:%M:%S")
                        .to_string();

                    if let Some(frontmatter) = matter.parse(&content).data {
                        if let Pod::Hash(frontmatter) = frontmatter {
                            if let Some(value) = frontmatter.get(&created_key.clone()) {
                                if let Ok(value) = value.as_string() {
                                    created = value;
                                }
                            }
                            if let Some(value) = frontmatter.get(&updated_key.clone()) {
                                if let Ok(value) = value.as_string() {
                                    updated = value;
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
