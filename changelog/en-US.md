# Changelog

## [Unreleased]

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
