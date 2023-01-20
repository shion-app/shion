Unicode true

####
## Please note: Template replacements don't work in this file. They are provided with default defines like
## mentioned underneath.
## If the keyword is not defined, "wails_tools.nsh" will populate them with the values from ProjectInfo.
## If they are defined here, "wails_tools.nsh" will not touch them. This allows to use this project.nsi manually
## from outside of Wails for debugging and development of the installer.
##
## For development first make a wails nsis build to populate the "wails_tools.nsh":
## > wails build --target windows/amd64 --nsis
## Then you can call makensis on this file with specifying the path to your binary:
## For a AMD64 only installer:
## > makensis -DARG_WAILS_AMD64_BINARY=..\..\bin\app.exe
## For a ARM64 only installer:
## > makensis -DARG_WAILS_ARM64_BINARY=..\..\bin\app.exe
## For a installer with both architectures:
## > makensis -DARG_WAILS_AMD64_BINARY=..\..\bin\app-amd64.exe -DARG_WAILS_ARM64_BINARY=..\..\bin\app-arm64.exe
####
## The following information is taken from the ProjectInfo file, but they can be overwritten here.
####
## !define INFO_PROJECTNAME    "MyProject" # Default "{{.Name}}"
## !define INFO_COMPANYNAME    "MyCompany" # Default "{{.Info.CompanyName}}"
## !define INFO_PRODUCTNAME    "MyProduct" # Default "{{.Info.ProductName}}"
## !define INFO_PRODUCTVERSION "1.0.0"     # Default "{{.Info.ProductVersion}}"
## !define INFO_COPYRIGHT      "Copyright" # Default "{{.Info.Copyright}}"
###
## !define PRODUCT_EXECUTABLE  "Application.exe"      # Default "${INFO_PROJECTNAME}.exe"
## !define UNINST_KEY_NAME     "UninstKeyInRegistry"  # Default "${INFO_COMPANYNAME}${INFO_PRODUCTNAME}"
####
## !define REQUEST_EXECUTION_LEVEL "admin"            # Default "admin"  see also https://nsis.sourceforge.io/Docs/Chapter4.html
####
## Include the wails tools
####
!include "wails_tools.nsh"

!define APP_CONFIG_DIR "$APPDATA\${INFO_COMPANYNAME}\${INFO_PRODUCTNAME}"
!define APP_CONFIG_FILE "${APP_CONFIG_DIR}\config.json"

# The version information for this two must consist of 4 parts
VIProductVersion "${INFO_PRODUCTVERSION}.0"
VIFileVersion    "${INFO_PRODUCTVERSION}.0"

VIAddVersionKey "CompanyName"     "${INFO_COMPANYNAME}"
VIAddVersionKey "FileDescription" "${INFO_PRODUCTNAME} Installer"
VIAddVersionKey "ProductVersion"  "${INFO_PRODUCTVERSION}"
VIAddVersionKey "FileVersion"     "${INFO_PRODUCTVERSION}"
VIAddVersionKey "LegalCopyright"  "${INFO_COPYRIGHT}"
VIAddVersionKey "ProductName"     "${INFO_PRODUCTNAME}"

!include "MUI.nsh"

!define MUI_ICON "..\icon.ico"
!define MUI_UNICON "..\icon.ico"
# !define MUI_WELCOMEFINISHPAGE_BITMAP "resources\leftimage.bmp" #Include this to add a bitmap on the left side of the Welcome Page. Must be a size of 164x314
!define MUI_FINISHPAGE_NOAUTOCLOSE # Wait on the INSTFILES page so the user can take a look into the details of the installation steps
!define MUI_ABORTWARNING # This will warn the user if they exit from the installer.
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_FUNCTION launchApplication

!define MUI_PAGE_CUSTOMFUNCTION_PRE skipPage
!insertmacro MUI_PAGE_WELCOME # Welcome to the installer page.
# !insertmacro MUI_PAGE_LICENSE "resources\eula.txt" # Adds a EULA page to the installer
!define MUI_PAGE_CUSTOMFUNCTION_PRE skipPage
!insertmacro MUI_PAGE_DIRECTORY # In which folder install page.
!insertmacro MUI_PAGE_INSTFILES # Installing page.
!insertmacro MUI_PAGE_FINISH # Finished installation page.

UninstPage Custom un.enterUninstallConfirm un.leaveUninstallConfirm
!insertmacro MUI_UNPAGE_INSTFILES # Uinstalling page

!insertmacro MUI_LANGUAGE "English" # Set the Language of the installer
!insertmacro MUI_LANGUAGE "SimpChinese"

!include nsDialogs.nsh
!include LogicLib.nsh
!include nsProcess.nsh

## The following two statements can be used to sign the installer and the uninstaller. The path to the binaries are provided in %1
#!uninstfinalize 'signtool --file "%1"'
#!finalize 'signtool --file "%1"'

Name "${INFO_PRODUCTNAME}"
OutFile "..\..\bin\${INFO_PROJECTNAME}-${ARCH}-installer.exe" # Name of the installer's file.
InstallDir "$PROGRAMFILES64\${INFO_COMPANYNAME}\${INFO_PRODUCTNAME}" # Default installing folder ($PROGRAMFILES is Program Files folder).
ShowInstDetails show # This will always show the installation details.

LangString LOCALE ${LANG_ENGLISH} "en-US"
LangString LOCALE ${LANG_SIMPCHINESE} "zh-CN"

LangString DELETE_CONFIG_TIP ${LANG_ENGLISH} "delete data file"
LangString DELETE_CONFIG_TIP ${LANG_SIMPCHINESE} "删除数据文件"
LangString PROGRAM_RUNNING_CONFIRM ${LANG_ENGLISH} "The program is running. Are you sure to close it?"
LangString PROGRAM_RUNNING_CONFIRM ${LANG_SIMPCHINESE} "程序正在运行，确认关闭吗?"

!macro checkProgramRunning
  ${nsProcess::FindProcess} ${PRODUCT_EXECUTABLE} $R0
  ${If} $R0 == 0
    MessageBox MB_YESNO $(PROGRAM_RUNNING_CONFIRM) IDYES true IDNO false
      true:
        ${nsProcess::CloseProcess} ${PRODUCT_EXECUTABLE} $R0
        Goto next
      false:
        Abort
      next:
        Sleep 500
  ${EndIf}
!macroend

; install

!macro createConfigFile
  IfFileExists ${APP_CONFIG_FILE} 0 file_not_found
    file_not_found:
      CreateDirectory ${APP_CONFIG_DIR}
      FileOpen $0 ${APP_CONFIG_FILE} w
      FileWrite $0 "{$\r$\n"
      FileWrite $0 '  "version": "${INFO_PRODUCTVERSION}",$\r$\n'
      FileWrite $0 '  "locale": "$(LOCALE)"$\r$\n'
      FileWrite $0 "}$\r$\n"
      FileClose $0
!macroend

var skip

Function skipPage
  ${If} $skip == "yes"
    Abort
  ${EndIf}
FunctionEnd

Function launchApplication
  ExecShell "" "$INSTDIR\${PRODUCT_EXECUTABLE}"
FunctionEnd

Function .onInit
  SetRegView 64
  ReadRegStr $0 HKLM ${UNINST_KEY} "DisplayIcon"
  ${If} $0 != ""
    StrCpy $skip "yes"
    ${GetParent} $0 $INSTDIR
    !insertmacro checkProgramRunning
  ${else}
    StrCpy $skip "no"
    !insertmacro wails.checkArchitecture
    !insertmacro MUI_LANGDLL_DISPLAY
    !insertmacro createConfigFile
  ${EndIf}
FunctionEnd

Section
  !insertmacro wails.webview2runtime

  SetOutPath $INSTDIR

  !insertmacro wails.files

  CreateShortcut "$SMPROGRAMS\${INFO_PRODUCTNAME}.lnk" "$INSTDIR\${PRODUCT_EXECUTABLE}"
  CreateShortCut "$DESKTOP\${INFO_PRODUCTNAME}.lnk" "$INSTDIR\${PRODUCT_EXECUTABLE}"

  !insertmacro wails.writeUninstaller
SectionEnd

; uninstall

var deleteConfigCheckbox
var deleteConfigState

Function un.enterUninstallConfirm
  nsDialogs::Create 1018
  Pop $0
  ${NSD_CreateCheckbox} 0 30u 100% 10u $(DELETE_CONFIG_TIP)
  Pop $deleteConfigCheckbox
  ${NSD_SetState} $deleteConfigCheckbox $deleteConfigState
  nsDialogs::Show
FunctionEnd

Function un.leaveUninstallConfirm
  ${NSD_GetState} $deleteConfigCheckbox $deleteConfigState
FunctionEnd

Function un.onInit
  !insertmacro checkProgramRunning
FunctionEnd

Section "uninstall"
  ${If} $deleteConfigState == ${BST_CHECKED}
    RMDir /r ${APP_CONFIG_DIR}
  ${EndIf}

  RMDir /r "$AppData\${PRODUCT_EXECUTABLE}" # Remove the WebView2 DataPath

  RMDir /r $INSTDIR

  Delete "$SMPROGRAMS\${INFO_PRODUCTNAME}.lnk"
  Delete "$DESKTOP\${INFO_PRODUCTNAME}.lnk"

  !insertmacro wails.deleteUninstaller
SectionEnd
