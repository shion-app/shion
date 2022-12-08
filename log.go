package main

import (
	"os"
	"path/filepath"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func newProduction(options ...zap.Option) (*zap.Logger, error) {
	config := zap.NewProductionConfig()
	config.Level = zap.NewAtomicLevelAt(zap.ErrorLevel)
	config.EncoderConfig.TimeKey = "timestamp"
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

	date := time.Now().Format("2006-01-02")
	logPath := filepath.Join(GetAppConfigDir(), "log")
	if _, err := os.Stat(logPath); os.IsNotExist(err) {
		os.Mkdir(logPath, os.ModePerm)
	}
	output := filepath.Join(logPath, date+".txt")
	if _, err := os.Stat(output); os.IsNotExist(err) {
		os.Create(output)
	}
	config.OutputPaths = []string{output}
	config.ErrorOutputPaths = []string{output}
	return config.Build(options...)
}

func NewLogger(isDev bool) *zap.Logger {
	var z *zap.Logger
	if isDev {
		z, _ = zap.NewDevelopment()
	} else {
		z, _ = newProduction()
	}
	return z
}
