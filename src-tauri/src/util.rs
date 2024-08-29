use std::{
    fs::{read_dir, read_to_string},
    hash::{DefaultHasher, Hash, Hasher},
    path::Path,
    time::UNIX_EPOCH,
};

use anyhow::anyhow;
use dateparser::DateTimeUtc;
use gray_matter::{engine::YAML, Matter, Pod};
use serde::Serialize;

use crate::Result;

#[derive(Serialize, Debug)]
pub struct ObsidianNote {
    name: String,
    path: String,
    created: i64,
    updated: i64,
    group: String,
    group_id: u64,
}

#[derive(Serialize, Debug)]
pub struct ObsidianGroup {
    name: String,
    id: u64,
}

pub fn read_obsidian<P>(
    path: P,
    created_key: String,
    updated_key: String,
    start: i64,
    end: i64,
) -> Result<Vec<ObsidianNote>>
where
    P: AsRef<Path>,
{
    let workspace = file_stem(&path)?;
    let mut list = vec![];
    for entry in read_dir(path)? {
        let path = entry?.path();
        let group_name = file_stem(&path)?;
        let mut queue = vec![];
        if path.is_dir() {
            queue.push(path);
        }
        while queue.len() > 0 {
            if let Some(path) = queue.pop() {
                if path.is_dir() {
                    for entry in read_dir(path)? {
                        let path = entry?.path();
                        queue.push(path);
                    }
                } else {
                    if let Some(ext) = path.extension() {
                        if ext == "md" {
                            let content = read_to_string(path.clone())?;
                            let matter = Matter::<YAML>::new();

                            let metadata = path.metadata()?;

                            let mut created =
                                metadata.created()?.duration_since(UNIX_EPOCH)?.as_millis() as i64;
                            let mut updated =
                                metadata.modified()?.duration_since(UNIX_EPOCH)?.as_millis() as i64;

                            if let Some(frontmatter) = matter.parse(&content).data {
                                if let Pod::Hash(frontmatter) = frontmatter {
                                    if let Some(value) = frontmatter.get(&created_key.clone()) {
                                        if let Ok(value) = value.as_string() {
                                            if let Ok(time) = value.parse::<DateTimeUtc>() {
                                                created = time.0.timestamp_millis();
                                            }
                                        }
                                    }
                                    if let Some(value) = frontmatter.get(&updated_key.clone()) {
                                        if let Ok(value) = value.as_string() {
                                            if let Ok(time) = value.parse::<DateTimeUtc>() {
                                                updated = time.0.timestamp_millis();
                                            }
                                        }
                                    }
                                }
                            }
                            if created > start && created < end {
                                let name = file_stem(&path)?;
                                let path =
                                    path.to_str().ok_or(anyhow!("invalid path"))?.to_string();
                                let group = format!("{}/{}", workspace, group_name.clone());
                                list.push(ObsidianNote {
                                    name,
                                    path,
                                    created,
                                    updated,
                                    group: group.clone(),
                                    group_id: text_to_hash(group.clone()),
                                })
                            }
                        }
                    }
                }
            }
        }
    }
    Ok(list)
}

fn text_to_hash(text: String) -> u64 {
    let mut hasher = DefaultHasher::new();
    text.hash(&mut hasher);
    hasher.finish()
}

fn file_stem<P>(path: P) -> Result<String>
where
    P: AsRef<Path>,
{
    Ok(path
        .as_ref()
        .file_stem()
        .ok_or(anyhow!("file_stem error"))?
        .to_str()
        .ok_or(anyhow!("file_stem to_str error"))?
        .to_string())
}

pub fn get_obsidian_group<P>(path: P) -> Result<Vec<ObsidianGroup>>
where
    P: AsRef<Path>,
{
    let workspace = file_stem(&path)?;
    let mut list = vec![];
    for entry in read_dir(path)? {
        let path = entry?.path();
        let group_name = file_stem(&path)?;
        let mut queue = vec![];
        if path.is_dir() {
            queue.push(path);
        }
        while queue.len() > 0 {
            if let Some(path) = queue.pop() {
                if path.is_dir() {
                    for entry in read_dir(path)? {
                        let path = entry?.path();
                        queue.push(path);
                    }
                } else {
                    if let Some(ext) = path.extension() {
                        let name = format!("{}/{}", workspace, group_name.clone());
                        if ext == "md" {
                            list.push(ObsidianGroup {
                                name: name.clone(),
                                id: text_to_hash(name),
                            });
                            break;
                        }
                    }
                }
            }
        }
    }
    Ok(list)
}
