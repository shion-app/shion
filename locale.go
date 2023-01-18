package main

import (
	"embed"

	"github.com/nicksnyder/go-i18n/v2/i18n"
	"golang.org/x/text/language"
	"gopkg.in/yaml.v3"
)

const (
	enUS = "en-US"
	zhCN = "zh-CN"
)

//go:embed all:locales
var LocaleFS embed.FS

func newLocalizer(locale string) *i18n.Localizer {
	bundle := i18n.NewBundle(language.SimplifiedChinese)
	bundle.RegisterUnmarshalFunc("yaml", yaml.Unmarshal)
	bundle.LoadMessageFileFS(LocaleFS, "locales/"+locale+".yaml")
	return i18n.NewLocalizer(bundle, locale)
}

var localeMap = map[string]*i18n.Localizer{}

func getLocalizer(locale string) *i18n.Localizer {
	if l, ok := localeMap[locale]; ok {
		return l
	} else {
		localeMap[locale] = newLocalizer(locale)
		return localeMap[locale]
	}
}

func translate(locale string, id string, data ...Map) string {
	l := getLocalizer(locale)
	var templateData = Map{}
	if len(data) > 0 {
		templateData = data[0]
	}
	str, err := l.Localize(&i18n.LocalizeConfig{
		MessageID:    id,
		TemplateData: templateData,
	})
	if err != nil {
		logger.Error(err.Error())
	}
	return str
}

func T(id string, data ...Map) string {
	return translate(config.Locale, id, data...)
}
