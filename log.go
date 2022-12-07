package main

import (
	"os"
	"path/filepath"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type Logger struct {
	zap *zap.Logger
}

func NewProduction(options ...zap.Option) (*zap.Logger, error) {
	config := zap.NewProductionConfig()
	config.EncoderConfig.TimeKey = "timestamp"
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

	date := time.Now().Format("2006-01-02")
	logPath := filepath.Join(getAppConfigDir(), "log")
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

func NewLogger(isDev bool) *Logger {
	var z *zap.Logger
	if isDev {
		z, _ = zap.NewDevelopment()
	} else {
		z, _ = NewProduction()
	}
	return &Logger{
		zap: z,
	}
}

func (l *Logger) Print(message string) {
	l.zap.Debug(message)
}

func (l *Logger) Trace(message string) {
	l.zap.Debug(message)
}

func (l *Logger) Debug(message string) {
	l.zap.Debug(message)
}

func (l *Logger) Info(message string) {
	l.zap.Info(message)
}

func (l *Logger) Warning(message string) {
	l.zap.Warn(message)
}

func (l *Logger) Error(message string) {
	l.zap.Error(message)
}

func (l *Logger) Fatal(message string) {
	l.zap.Fatal(message)
}

func (l *Logger) Sync() {
	l.zap.Sync()
}
