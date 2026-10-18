Get-CimInstance Win32_Process |
  Where-Object { $_.Name -match 'node|next|npm' -and $_.CommandLine -match 'apps\\web|autarch|next' } |
  Select-Object ProcessId, ParentProcessId, @{n='Cmd';e={$_.CommandLine.Substring(0, [Math]::Min(180, $_.CommandLine.Length))}} |
  Format-Table -AutoSize | Out-String -Width 220
