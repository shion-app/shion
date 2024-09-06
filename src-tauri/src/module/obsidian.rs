use std::{
    fs::{read_dir, read_to_string},
    hash::{DefaultHasher, Hash, Hasher},
    path::Path,
    time::UNIX_EPOCH,
};

use anyhow::anyhow;
use dateparser::DateTimeUtc;
use gray_matter::{engine::YAML, Matter, Pod};
use grep::searcher::{BinaryDetection, Searcher, SearcherBuilder, Sink};
use grep::{matcher::Matcher, regex::RegexMatcher};
use serde::Serialize;
use walkdir::WalkDir;

use crate::Result;

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ObsidianNote {
    name: String,
    path: String,
    created: i64,
    updated: i64,
    group: String,
    group_id: u32,
}

#[derive(Serialize, Debug)]
pub struct ObsidianGroup {
    name: String,
    id: u32,
}

pub fn read<P>(
    workspace: P,
    created_key: String,
    updated_key: String,
    start: i64,
    end: i64,
    group_id: Option<u32>,
) -> Result<Vec<ObsidianNote>>
where
    P: AsRef<Path>,
{
    let workspace_name = file_stem(&workspace)?;
    let mut list = vec![];
    for entry in read_dir(workspace)? {
        let group_path = entry?.path();
        if group_path.is_file() {
            continue;
        }

        let group_name = file_stem(&group_path)?;
        for entry in WalkDir::new(group_path).into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();

            if path.is_file() {
                if let Some(ext) = path.extension() {
                    if ext == "md" {
                        let FileMetadata { created, updated } =
                            get_metadata(&path, created_key.clone(), updated_key.clone())?;
                        if created > start && created < end {
                            let name = file_stem(&path)?;
                            let path = path_to_string(path)?;
                            let group = format!("{}/{}", workspace_name, group_name.clone());
                            let current_group_id = text_to_hash(group.clone());
                            let insert = if let Some(group_id) = group_id {
                                group_id == current_group_id
                            } else {
                                true
                            };
                            if insert {
                                list.push(ObsidianNote {
                                    name,
                                    path,
                                    created,
                                    updated,
                                    group: group.clone(),
                                    group_id: current_group_id,
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

fn text_to_hash(text: String) -> u32 {
    let mut hasher = DefaultHasher::new();
    text.hash(&mut hasher);
    hasher.finish() as u32
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

fn path_to_string(path: &Path) -> Result<String> {
    Ok(path.to_str().ok_or(anyhow!("invalid path"))?.to_string())
}

pub fn get_group<P>(workspace: P) -> Result<Vec<ObsidianGroup>>
where
    P: AsRef<Path>,
{
    let workspace_name = file_stem(&workspace)?;
    let mut list = vec![];
    for entry in read_dir(workspace)? {
        let group_path = entry?.path();
        if group_path.is_file() {
            continue;
        }

        let group_name = file_stem(&group_path)?;
        for entry in WalkDir::new(group_path).into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();

            if path.is_file() {
                if let Some(ext) = path.extension() {
                    if ext == "md" {
                        let name = format!("{}/{}", workspace_name, group_name.clone());
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
    Ok(list)
}

#[derive(Serialize, Debug, Clone)]
pub struct FileMetadata {
    created: i64,
    updated: i64,
}

fn get_metadata<P>(path: P, created_key: String, updated_key: String) -> Result<FileMetadata>
where
    P: AsRef<Path>,
{
    let content = read_to_string(&path)?;
    let matter = Matter::<YAML>::new();

    let metadata = path.as_ref().metadata()?;

    let mut created = metadata.created()?.duration_since(UNIX_EPOCH)?.as_millis() as i64;
    let mut updated = metadata.modified()?.duration_since(UNIX_EPOCH)?.as_millis() as i64;

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

    Ok(FileMetadata { created, updated })
}

#[derive(Serialize, Debug)]
pub struct SearchItem {
    pub path: String,
    pub matched: String,
    pub target: String,
    pub metadata: FileMetadata,
}

struct ObsidianSink {
    path: String,
    results: Vec<SearchItem>,
    metadata: FileMetadata,
}

impl Sink for ObsidianSink {
    type Error = std::io::Error;

    fn matched(
        &mut self,
        _searcher: &Searcher,
        mat: &grep::searcher::SinkMatch<'_>,
    ) -> std::result::Result<bool, std::io::Error> {
        let matched = String::from_utf8_lossy(mat.bytes()).to_string();

        self.results.push(SearchItem {
            path: self.path.clone(),
            matched,
            target: "content".to_string(),
            metadata: self.metadata.clone(),
        });

        Ok(true)
    }
}

pub fn search(
    pattern: String,
    workspace: String,
    created_key: String,
    updated_key: String,
    start: Option<i64>,
    end: Option<i64>,
) -> Result<Vec<SearchItem>> {
    let matcher = RegexMatcher::new(&format!(r"{}", pattern))?;
    let mut searcher = SearcherBuilder::new()
        .binary_detection(BinaryDetection::quit(b'\x00'))
        .line_number(false)
        .build();

    let mut list = vec![];

    for entry in WalkDir::new(workspace.clone())
        .into_iter()
        .filter_entry(|e| {
            let plguin_path = Path::new(&workspace).join(".obsidian");
            !e.path().starts_with(plguin_path)
        })
        .filter_map(|e| e.ok())
    {
        if !entry.file_type().is_file() {
            continue;
        }

        let metadata = get_metadata(entry.path(), created_key.clone(), updated_key.clone())?;

        let FileMetadata { created, .. } = metadata;

        let start = start.unwrap_or(0);
        let end = end.unwrap_or(i64::MAX);

        let is_outside_range = created < start || created > end;

        if is_outside_range {
            continue;
        }

        let file_path = path_to_string(entry.path())?;

        let mut sink = ObsidianSink {
            path: file_path.clone(),
            results: Vec::new(),
            metadata: metadata.clone(),
        };

        let is_file_name_match = matcher.is_match(entry.file_name().as_encoded_bytes())?;

        if is_file_name_match {
            let matched = file_stem(entry.path())?;
            list.push(SearchItem {
                path: file_path,
                matched,
                target: "filename".to_string(),
                metadata,
            })
        }

        searcher.search_path(&matcher, entry.path(), &mut sink)?;

        list.append(&mut sink.results);
    }

    Ok(list)
}

#[cfg(test)]
mod tests {

    use super::*;

    #[test]
    fn test_search() -> Result<()> {
        let path = "E:\\obsidian workspace\\hana".to_string();
        let list = search(
            "shion".to_string(),
            path,
            "created".to_string(),
            "updated".to_string(),
            None,
            None,
        )?;
        println!("{:#?}", list);
        Ok(())
    }
}
