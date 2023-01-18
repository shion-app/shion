package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// inject
var (
	mode    = "development"
	version = ""
	appName = ""
	author  = ""
)

type Config struct {
	Version         string `json:"version"`
	Locale          string `json:"locale"`
	AutoCheckUpdate bool   `json:"autoCheckUpdate"`
}

var config = Config{
	Version:         version,
	Locale:          defaultLocale,
	AutoCheckUpdate: true,
}

var (
	isDev = mode == "development"
)

func getConfigDir() string {
	if isDev {
		pwd, _ := os.Getwd()
		return filepath.Join(pwd, "build", "bin")
	}
	dir, _ := os.UserConfigDir()
	return dir
}

func GetAppConfigDir() string {
	config := getConfigDir()
	dir := filepath.Join(config, author, appName)
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		println("Error:", err.Error())
	}
	return dir
}

func GetDownloadConfigDir() string {
	appDir := GetAppConfigDir()
	dir := filepath.Join(appDir, "download")
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		println("Error:", err.Error())
	}
	return dir
}

func readConfig() (err error) {
	appDir := GetAppConfigDir()
	file := filepath.Join(appDir, "config.json")
	_, err = os.Stat(file)
	if os.IsNotExist(err) {
		err = WriteConfig()
		return
	}
	data, err := os.ReadFile(file)
	if err != nil {
		return
	}
	err = json.Unmarshal(data, &config)
	if err != nil {
		return
	}
	return
}

func WriteConfig() (err error) {
	appDir := GetAppConfigDir()
	file := filepath.Join(appDir, "config.json")
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return
	}
	err = os.WriteFile(file, data, 0666)
	return
}
