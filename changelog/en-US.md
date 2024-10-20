# Changelog

## [Unreleased]

## [0.13.0] - 2024-10-21

### Added

- Data collection `Dimension`
- Overview chart adds data category `Dimension`
- Add new chart `single category heatmap`

### Changed

- Modify overview chart display
- Add `Dimension` tag to label and monitoring page
- Optimize timepicker component

### Fixed

- After `direct input` on label page, page is not refreshed

## [0.12.4] - 2024-09-22

### Added

- Dark mode
- Window size and position will be saved
- New version release will be displayed in the status bar

### Changed

- Remove window size limit
- `Active Calendar` removes width limit and will change with width

### Removed

- `Moment` related pages have been removed

## [0.12.3] - 2024-09-12

### Added

- Add support for Arc browser
- Add multiple formats and jump functions to `Timeline` search

### Changed

- `Overview` daily active chart floating distinction highlighted area

## [0.12.2] - 2024-08-31

### Added

- Add [obsidian](https://shion.app/guide/obsidian) to `Extensions`
- Add `obsidian notes` to `Timeline`

### Changed

- Changes in `Extensions` structure require resetting ⚠️
- Optimize the data acquisition speed of `Overview` chart 🚀
- Optimize the language display of the startup interface

## [0.12.1] - 2024-08-31 [YANKED]

## [0.12.0] - 2024-08-18

### Added

- Add hex input to the color picker component
- Add [third-party application integration](https://shion.app/guide/api)
- Add `Extension` built-in [Dandanplay Service](https://shion.app/guide/extension)

### Changed

- `Moment` **Rewrite**, provide export to markdown function ⚠️
- Change database transaction implementation
- Adjust `Timeline` display and behavior
- Adjust pull history display

## [0.11.23] - 2024-08-05

### Changed

- Removed default administrator autostart, added setting for selection (unless necessary, administrator autostart is not recommended)

### Fixed

- Minimize the window, click the tray and the window will not be displayed

## [0.11.22] - 2024-07-30

### Added

- Added `Announcement` column, `Pre-view` and `Xiaohongshu`
- Now you can view all logs in the app

### Changed

- Upgrade vue, tauri dependencies
- Modify `import and export`, `about` dialog style

## [0.11.21] - 2024-07-21

### Fixed

- Manual timer not cleared after expiration

## [0.11.20] - 2024-07-21

### Fixed

- Manual timer not initialized affects application hooks

## [0.11.19] - 2024-07-21

### Changed

- Refactored manual timer
- Modified `Data category` item of `Overview` to create display component (incompatible with previous one, modification requires reselection)
- Adjusted `Timeline` to misalign the same time point
- Added seconds option to the time selection component

## [0.11.18] - 2024-07-12

### Added

- Scheduled pulling of historical records
- Scheduled export of data backup and its settings

### Changed

- `Settings` style
- Time related component styles

## [0.11.17] - 2024-07-06

### Changed

- `Overview` chart style

### Fixed

- `Daily Activity Chart` vertical time arrangement

## [0.11.16] - 2024-07-05

### Fixed

- The tooltip position after dragging the chart in `Overview`
- Pulling browser history, some users will get an error when deleting temporary files

## [0.11.15] - 2024-06-30

### Added

- Add steam release channel, and [free serial number](https://github.com/shion-app/shion/discussions/37)

### Fixed

- Changelog link jumps in the app

## [0.11.14] - 2024-06-30

### Fixed

- Memory explosion caused by layout💣

## [0.11.13] - 2024-06-30 [YANKED]

## [0.11.12] - 2024-06-27

### Changed

- Add autostart delay

### Fixed

- `Overview` active status calendar with diary cannot switch date

## [0.11.11] - 2024-06-25

### Added

- Processing of `Settings` startup after migration

### Fixed

- `Timeline` link cannot be clicked

## [0.11.10] - 2024-06-24

### Changed

- Autostart settings

### Fixed

- Tauri tray is not created

## [0.11.9] - 2024-06-22

### Fixed

- `Overview` refresh chart not update

## [0.11.8] - 2024-06-21

### Changed

- Modify layout implementation
- Style adjustment, layout operation optimization

### Fixed

- `Overview` chart does not update status when modifying configuration (https://github.com/shion-app/shion/issues/31)

## [0.11.7] - 2024-06-19

### Changed

- The program is changed to run as an administrator by default
- Startup method

### Fixed

- Duplicate paths exist when filtering with `automatic monitoring`
- Cannot get the program window running as an administrator when filtering with `automatic monitoring`

## [0.11.6] - 2024-06-19 [YANKED]

## [0.11.5] - 2024-06-08

### Added

- Add options that provide webisite icon for `Timeline` in `Setting`
- Add directly input data in `Manual timing`
- Add image and video preview window in `Moment`
- Add drag and drop upload in `Moment`

### Changed

- Modify `Setting` style
- Modify `Manual timing` menu after expanding `Timeline` data group

## [0.11.4] - 2024-05-31

### Added

- Add icons to `Automatic monitoring` and `Browser History` in the timeline
- Add option to decide whether to show the window at startup in `Setting`

### Fixed

- Table does not exist when pulling browser history (https://github.com/shion-app/shion/issues/19)

## [0.11.3] - 2024-05-30

### Added

- Add verification and migration to import and export
- In `View`-`Setting`-`Behavior`, add a whitelist for automatic monitoring to automatically add programs
- Add a shortcut key `ctrl+f` to search
- Add time property for each item in search dialog
- Add a quick show and hide browser history button to the timeline
- When switching `Data Grouping` and `Browser History`, the timeline automatically slides to the most recent time

### Changed

- Replace the solution of using PowerShell to get the program running in the foreground

## [0.11.2] - 2024-05-25

### Changed

- Update cli, the installation program automatically adds a specific folder after selecting the path (https://github.com/shion-app/shion/issues/13)

## [0.11.1] - 2024-05-24

### Fixed

- Powershell executes an error when there are Chinese comments present (https://github.com/shion-app/shion/issues/12)

## [0.11.0] - 2024-05-21

### Added

- Overview page recent activity pie chart
- Overview page vertical arrangement for charts
- Monitor page can modify the program path
- Importing and exporting data
- Changelog
