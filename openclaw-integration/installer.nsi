; OpenClaw HCC Integration - NSIS Installer Script
; Installer for Windows

!include "MUI2.nsh"

; General Settings
Name "OpenClaw HCC Integration"
OutFile "openclaw-installer.exe"
InstallDir "$PROGRAMFILES\OpenClaw"
InstallDirRegKey HKCU "Software\OpenClaw" "InstallDir"

; Request Admin Rights
RequestExecutionLevel admin

; MUI Settings
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

; Installer Sections
Section "OpenClaw HCC Integration"
  SetOutPath "$INSTDIR"
  
  ; Copy executable
  File "dist\openclaw.exe"
  
  ; Copy documentation
  File "README.md"
  File "QUICK_REFERENCE.md"
  File "COMPLETION_REPORT.md"
  File "AUDIT_AND_FIXES_REPORT.md"
  
  ; Copy configuration template
  File ".env"
  
  ; Create directories
  CreateDirectory "$INSTDIR\data"
  CreateDirectory "$INSTDIR\logs"
  
  ; Write registry
  WriteRegStr HKCU "Software\OpenClaw" "InstallDir" "$INSTDIR"
  
  ; Create Start Menu shortcuts
  CreateDirectory "$SMPROGRAMS\OpenClaw"
  CreateShortcut "$SMPROGRAMS\OpenClaw\OpenClaw.lnk" "$INSTDIR\openclaw.exe"
  CreateShortcut "$SMPROGRAMS\OpenClaw\Documentation.lnk" "$INSTDIR\README.md"
  CreateShortcut "$SMPROGRAMS\OpenClaw\Quick Reference.lnk" "$INSTDIR\QUICK_REFERENCE.md"
  
  ; Create desktop shortcut
  CreateShortcut "$DESKTOP\OpenClaw.lnk" "$INSTDIR\openclaw.exe"
  
  ; Add to PATH
  ReadRegStr $0 HKCU "Environment" "PATH"
  ${If} $0 == ""
    WriteRegStr HKCU "Environment" "PATH" "$INSTDIR"
  ${Else}
    ${If} $0 != "$INSTDIR"
      WriteRegStr HKCU "Environment" "PATH" "$INSTDIR;$0"
    ${EndIf}
  ${EndIf}
  
  ; Notify system of environment change
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\OpenClaw" "DisplayName" "OpenClaw HCC Integration"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\OpenClaw" "UninstallString" "$INSTDIR\Uninstall.exe"
SectionEnd

; Uninstaller
Section "Uninstall"
  ; Remove files
  Delete "$INSTDIR\openclaw.exe"
  Delete "$INSTDIR\README.md"
  Delete "$INSTDIR\QUICK_REFERENCE.md"
  Delete "$INSTDIR\COMPLETION_REPORT.md"
  Delete "$INSTDIR\AUDIT_AND_FIXES_REPORT.md"
  Delete "$INSTDIR\.env"
  Delete "$INSTDIR\Uninstall.exe"
  
  ; Remove directories
  RMDir /r "$INSTDIR\data"
  RMDir /r "$INSTDIR\logs"
  RMDir "$INSTDIR"
  
  ; Remove shortcuts
  RMDir /r "$SMPROGRAMS\OpenClaw"
  Delete "$DESKTOP\OpenClaw.lnk"
  
  ; Remove registry entries
  DeleteRegKey HKCU "Software\OpenClaw"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\OpenClaw"
  
  ; Remove from PATH
  ReadRegStr $0 HKCU "Environment" "PATH"
  ${StrReplace} $0 "$INSTDIR;" "" $0
  ${StrReplace} $0 "$INSTDIR" "" $0
  WriteRegStr HKCU "Environment" "PATH" $0
  
  ; Notify system
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000
SectionEnd
