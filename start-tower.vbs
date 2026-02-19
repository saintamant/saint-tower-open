Set WshShell = CreateObject("WScript.Shell")

' Start npm run dev minimized
WshShell.CurrentDirectory = "."
WshShell.Run "cmd /c npm run dev", 7, False

' Wait for server to be ready then open browser
WScript.Sleep 6000
WshShell.Run "http://localhost:3000", 1, False
