package main

import (
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

var (
	isDev  = mode == "development"
	locale = defaultLocale
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
