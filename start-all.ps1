$ErrorActionPreference = 'Stop'

Set-Location $PSScriptRoot

# Stop stale project-related processes so the next start is clean.
$projectPattern = [regex]::Escape($PSScriptRoot)
$processPatterns = @(
	'@ai-sa\\bot',
	'@ai-sa\\api',
	'@ai-sa\\web',
	'apps\\bot',
	'apps\\api',
	'apps\\web',
	'tsx watch src/index.ts',
	'vite',
	'wrangler',
	'ngrok',
	'cloudflared',
	'localtunnel'
)

$staleProcesses = Get-CimInstance Win32_Process |
	Where-Object {
		$process = $_
		$matchedPattern = $false

		if ($process.Name -in @('node.exe', 'ngrok.exe', 'cloudflared.exe', 'wrangler.exe') -and $process.CommandLine) {
			if ($process.CommandLine -match $projectPattern) {
				$matchedPattern = $true
			} else {
				foreach ($pattern in $processPatterns) {
					if ($process.CommandLine -match $pattern) {
						$matchedPattern = $true
						break
					}
				}
			}
		}

		$matchedPattern
	}

if ($staleProcesses) {
	$staleProcesses | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
}

npm run dev
