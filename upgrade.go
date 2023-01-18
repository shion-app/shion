package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/coreos/go-semver/semver"
	"github.com/samber/lo"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/registry"
)

type Release struct {
	TagName string `json:"tag_name"`
	Assets  []Asset
}

type Asset struct {
	Size int
	Name string
	Url  string `json:"browser_download_url"`
}

func checkExistInstaller() bool {
	path := fmt.Sprintf(`Software\Microsoft\Windows\CurrentVersion\Uninstall\%s%s`, author, appName)
	key, err := registry.OpenKey(registry.LOCAL_MACHINE, path, registry.QUERY_VALUE)
	if err != nil {
		return false
	}
	value, _, _ := key.GetStringValue("DisplayIcon")
	exe, _ := os.Executable()
	return value == exe
}

func CheckUpgrade() (needUpgrade bool, tagName string, asset Asset, err error) {
	res, err := http.Get(fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", author, appName))
	if err != nil {
		return
	}
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	if err != nil {
		return
	}
	var data Release
	err = json.Unmarshal(body, &data)
	if err != nil {
		return
	}
	tagName = data.TagName
	if len(tagName) == 0 {
		return
	}
	asset, _ = lo.Find(data.Assets, func(asset Asset) bool {
		if checkExistInstaller() {
			return strings.Contains(asset.Name, "installer")
		} else {
			return asset.Name == fmt.Sprintf("%s.exe", appName)
		}
	})
	newVersion := tagName[1:]
	needUpgrade = semver.New(version).LessThan(*semver.New(newVersion))
	return
}

func downloadProgress(done chan int64, path string, total int64) (err error) {
	stop := false
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()
	for {
		select {
		case <-done:
			stop = true
		default:
			fi, err := file.Stat()
			if err != nil {
				return err
			}

			size := fi.Size()
			if size == 0 {
				size = 1
			}

			runtime.EventsEmit(app.ctx, "upgrading", size, total)
		}

		if stop {
			break
		}
		time.Sleep(time.Second / 60)
	}
	return
}

func download(asset Asset) (path string, err error) {
	dir := GetDownloadConfigDir()
	path = filepath.Join(dir, asset.Name)

	out, err := os.Create(path)
	if err != nil {
		return
	}
	defer out.Close()

	resp, err := http.Get(asset.Url)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	done := make(chan int64)
	go downloadProgress(done, path, int64(asset.Size))

	written, err := io.Copy(out, resp.Body)
	if err != nil {
		return
	}
	done <- written

	return
}

func replace(assetExe string) (currentExe string, err error) {
	currentExe, err = os.Executable()
	if err != nil {
		return
	}
	dir := filepath.Dir(currentExe)
	oldExe := filepath.Join(dir, "old.exe")
	err = os.Rename(currentExe, oldExe)
	if err != nil {
		return
	}
	err = moveFile(assetExe, currentExe)
	return
}

func moveFile(sourcePath, destPath string) (err error) {
	inputFile, err := os.Open(sourcePath)
	if err != nil {
		return
	}
	outputFile, err := os.Create(destPath)
	if err != nil {
		inputFile.Close()
		return
	}
	defer outputFile.Close()
	_, err = io.Copy(outputFile, inputFile)
	inputFile.Close()
	if err != nil {
		return
	}
	err = os.Remove(sourcePath)
	if err != nil {
		return
	}
	return
}

func DeleteUpgradeTemp() {
	currentExe, err := os.Executable()
	if err != nil {
		return
	}
	dir := filepath.Dir(currentExe)
	oldExe := filepath.Join(dir, "old.exe")
	os.Remove(oldExe)
	download := GetDownloadConfigDir()
	os.Remove(download)
}

func Upgrade(asset Asset) (err error) {
	assetExe, err := download(asset)
	if err != nil {
		return
	}
	if checkExistInstaller() {
		err = runMeElevated(assetExe)
		if err != nil {
			return
		}
	} else {
		currentExe, err := replace(assetExe)
		if err != nil {
			return err
		}
		exec.Command(currentExe).Start()
	}
	os.Exit(0)
	return nil
}

func runMeElevated(exe string) error {
	verb := "runas"
	cwd, _ := os.Getwd()
	args := strings.Join(os.Args[1:], " ")

	verbPtr, _ := syscall.UTF16PtrFromString(verb)
	exePtr, _ := syscall.UTF16PtrFromString(exe)
	cwdPtr, _ := syscall.UTF16PtrFromString(cwd)
	argPtr, _ := syscall.UTF16PtrFromString(args)

	var showCmd int32 = 1 //SW_NORMAL

	err := windows.ShellExecute(0, verbPtr, exePtr, argPtr, cwdPtr, showCmd)
	return err
}
