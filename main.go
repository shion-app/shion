package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS
var app *App
var logger *Logger

func main() {
	dir := getAppConfigDir()
	store := initStore(dir)

	go watch()

	// Create an instance of the app structure
	app = NewApp(store)

	logger = NewLogger(isDev)

	// Create application with options
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
		Logger:     logger,
		Bind: []interface{}{
			app,
		},
		Windows: &windows.Options{
			OnSuspend: closeWatch,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}

	defer logger.Sync()

	defer store.db.Close()
}
