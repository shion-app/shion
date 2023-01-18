package main

import (
	"embed"

	"github.com/coreos/go-semver/semver"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

//go:embed all:frontend/dist
var assets embed.FS

var logger *zap.Logger = NewLogger()
var app *App = NewApp()
var db *gorm.DB

func init() {
	// BUG: build时会运行semver报错
	if len(version) == 0 {
		return
	}

	err := readConfig()
	if err != nil {
		logger.Error(err.Error())
	}

	db = InitDatabase()

	upgraded := semver.New(config.Version).LessThan(*semver.New(version))
	if upgraded {
		DeleteUpgradeTemp()
		config.Version = version
		err = WriteConfig()
		if err != nil {
			logger.Error(err.Error())
		}
	}
}

func main() {
	Watch()

	err := wails.Run(&options.App{
		Title:      appName,
		MinWidth:   960,
		MinHeight:  540,
		Width:      960,
		Height:     540,
		Assets:     assets,
		OnStartup:  app.startup,
		OnDomReady: app.domReady,
		OnShutdown: app.shutdown,
		// Logger:     logger,
		Frameless: true,
		Bind: []interface{}{
			app,
		},
		Windows: &windows.Options{
			OnSuspend: CloseWatch,
		},
		Debug: options.Debug{
			OpenInspectorOnStartup: true,
		},
	})

	if err != nil {
		logger.Error(err.Error())
	}

	defer logger.Sync()
}
