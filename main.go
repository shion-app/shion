package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

//go:embed all:frontend/dist
var assets embed.FS

var logger *zap.Logger
var db *gorm.DB
var app *App

func main() {
	logger = NewLogger()
	db = InitDatabase()
	app = NewApp()

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
