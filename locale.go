package main

import (
	"github.com/nicksnyder/go-i18n/v2/i18n"
	"golang.org/x/text/language"
	"gopkg.in/yaml.v3"
)

func newLocalizer(locale string) *i18n.Localizer {
	var bundle *i18n.Bundle
	switch locale {
	case "zh-CN":
		bundle = i18n.NewBundle(language.SimplifiedChinese)
	}
	bundle.RegisterUnmarshalFunc("yaml", yaml.Unmarshal)
	bundle.LoadMessageFile("locales/" + locale + ".yaml")
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

func Translate(locale string, id string, data Map) string {
	l := getLocalizer(locale)
	str, err := l.Localize(&i18n.LocalizeConfig{
		MessageID:    id,
		TemplateData: data,
	})
	if err != nil {
		logger.Error(err.Error())
	}
	return str
}
