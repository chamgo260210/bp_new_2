[CmdletBinding()]
param(
    [string]$EnvFile = "",
    [int]$FrontendPort = 3000,
    [int]$BackendPort = 8080,
    [int]$AiServerPort = 8000,
    [switch]$KeepEnvironment
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$composeFiles = @(
    "-f", (Join-Path $root "compose.yaml"),
    "-f", (Join-Path $root "compose.e2e.yaml")
)
if (-not [string]::IsNullOrWhiteSpace($EnvFile)) {
    $resolvedEnv = (Resolve-Path -LiteralPath $EnvFile).Path
    $composeFiles = @("--env-file", $resolvedEnv) + $composeFiles
}

$frontendBase = "http://127.0.0.1:$FrontendPort"
$backendBase = "http://127.0.0.1:$BackendPort"
$aiBase = "http://127.0.0.1:$AiServerPort"
$sampleImage = Join-Path ([IO.Path]::GetTempPath()) (
    "aivle-docker-e2e-" + [guid]::NewGuid().ToString("N") + ".png"
)

function Invoke-Compose {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    & docker compose @composeFiles @Args
    if ($LASTEXITCODE -ne 0) {
        throw "docker compose command failed: $($Args -join ' ')"
    }
}

function Wait-Http {
    param([string]$Uri, [int]$TimeoutSeconds = 120)
    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    do {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Uri `
                -TimeoutSec 3
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
                return
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    } while ([DateTime]::UtcNow -lt $deadline)
    throw "Timed out waiting for $Uri"
}

function Wait-Job {
    param(
        [long]$JobId,
        [hashtable]$Headers,
        [int]$TimeoutSeconds = 60
    )
    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    do {
        $response = Invoke-RestMethod -Uri (
            "$frontendBase/api/v1/jobs/$JobId"
        ) -Headers $Headers -TimeoutSec 10
        if ($response.data.status -in @("SUCCEEDED", "FAILED")) {
            return $response.data
        }
        Start-Sleep -Milliseconds 500
    } while ([DateTime]::UtcNow -lt $deadline)
    throw "Timed out waiting for job $JobId"
}

function New-JsonPost {
    param(
        [string]$Uri,
        [hashtable]$Headers,
        [object]$Body
    )
    Invoke-RestMethod -Method Post -Uri $Uri -Headers $Headers `
        -ContentType "application/json" -Body ($Body | ConvertTo-Json) `
        -TimeoutSec 30
}

try {
    Push-Location $root
    Invoke-Compose config --quiet
    Invoke-Compose up --build --detach

    Wait-Http "$frontendBase/healthz" 180
    Wait-Http "$backendBase/actuator/health" 180
    Wait-Http "$aiBase/health/live" 60
    Wait-Http "$aiBase/health/ready" 60

    $initExit = (& docker compose @composeFiles ps --all `
        --format "{{.ExitCode}}" minio-init).Trim()
    if ($LASTEXITCODE -ne 0 -or $initExit -ne "0") {
        throw "MinIO bucket initialization did not complete successfully."
    }

    $suffix = [guid]::NewGuid().ToString("N")
    $requestId = [guid]::NewGuid().ToString()
    $signup = New-JsonPost "$frontendBase/api/v1/auth/signup" @{} @{
        username = "e2e" + $suffix.Substring(0, 12)
        password = "Q7!" + $suffix.Substring(0, 20)
        displayName = "Docker E2E User"
        email = "docker-e2e-$suffix@example.com"
        organizationName = $null
        departmentName = $null
        jobTitle = $null
    }
    $headers = @{
        "X-User-Id" = "$($signup.data.user.id)"
        "X-User-Role" = "USER"
        "X-Request-Id" = $requestId
    }
    $project = New-JsonPost "$frontendBase/api/v1/projects" $headers @{
        title = "Docker E2E " + $suffix.Substring(0, 8)
        description = "Disposable full-stack integration project"
        industryCategory = "test"
    }
    $projectId = $project.data.id

    $headers["Idempotency-Key"] = "system-$suffix"
    $system = New-JsonPost (
        "$frontendBase/api/v1/projects/$projectId/ai-tasks/smoke"
    ) $headers @{}
    $systemJob = Wait-Job $system.data.jobId $headers
    if ($systemJob.status -ne "SUCCEEDED") {
        throw "SYSTEM_SMOKE_TEST failed: $($systemJob.errorCode)"
    }

    $headers["Idempotency-Key"] = "artifact-$suffix"
    $artifact = New-JsonPost (
        "$frontendBase/api/v1/projects/$projectId/ai-tasks/artifact-smoke"
    ) $headers @{}
    $artifactJob = Wait-Job $artifact.data.jobId $headers
    if ($artifactJob.status -ne "SUCCEEDED") {
        throw "SYSTEM_ARTIFACT_SMOKE_TEST failed: $($artifactJob.errorCode)"
    }
    $artifactDownload = Invoke-WebRequest -UseBasicParsing -Uri (
        "$frontendBase/api/v1/projects/$projectId/ai-tasks/" +
        "$($artifact.data.jobId)/artifacts/result"
    ) -Headers $headers -TimeoutSec 15
    $artifactText = if ($artifactDownload.Content -is [byte[]]) {
        [Text.Encoding]::UTF8.GetString($artifactDownload.Content)
    } else {
        [string]$artifactDownload.Content
    }
    $artifactJson = $artifactText | ConvertFrom-Json
    if ($artifactJson.status -ne "processed") {
        throw "Artifact download content was not the expected result."
    }

    $content = New-JsonPost (
        "$frontendBase/api/v1/projects/$projectId/marketing-contents"
    ) $headers @{
        title = "Docker Campaign"
        purpose = "PRODUCT_INTRODUCTION"
        channel = "SOCIAL"
        format = "SQUARE_1080"
        width = $null
        height = $null
        personaId = $null
        targetOffer = "Container verified service"
        emphasisMessage = "Reliable"
        requiredText = ""
        avoidedText = ""
        brandName = "Aivle"
        brandColor = "#0f8878"
        callToAction = "Learn more"
        tone = "PROFESSIONAL"
        template = "HERO_CENTER"
        panelInterviewId = $null
        marketResponseId = $null
    }
    $contentId = $content.data.content.id
    $sourceVersionId = $content.data.current.id
    [IO.File]::WriteAllBytes(
        $sampleImage,
        [Convert]::FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        )
    )
    $headers["Idempotency-Key"] = "marketing-$suffix"
    $nativeCurl = Get-Command curl.exe -ErrorAction SilentlyContinue
    $curl = if ($null -ne $nativeCurl) {
        $nativeCurl.Source
    } else {
        (Get-Command curl -CommandType Application -ErrorAction Stop).Source
    }
    $generateUrl = (
        "$frontendBase/api/v1/projects/$projectId/marketing-contents/" +
        "$contentId/generate?sourceVersionId=$sourceVersionId"
    )
    $generateText = & $curl --silent --show-error --fail-with-body `
        -H "X-User-Id: $($signup.data.user.id)" `
        -H "X-User-Role: USER" `
        -H "X-Request-Id: $requestId" `
        -H "Idempotency-Key: marketing-$suffix" `
        -F "image=@$sampleImage;type=image/png" $generateUrl
    if ($LASTEXITCODE -ne 0) {
        throw "Marketing generation request failed: $generateText"
    }
    $marketing = $generateText | ConvertFrom-Json
    $marketingJob = Wait-Job $marketing.data.jobId $headers
    if ($marketingJob.status -ne "SUCCEEDED") {
        throw "MARKETING_GENERATION failed: $($marketingJob.errorCode)"
    }
    $versions = Invoke-RestMethod -Uri (
        "$frontendBase/api/v1/projects/$projectId/marketing-contents/" +
        "$contentId/versions"
    ) -Headers $headers -TimeoutSec 15
    if ($versions.data.Count -ne 2 -or -not $versions.data[0].aiGenerated) {
        throw "Generated marketing version was not appended."
    }
    $marketingDownload = Invoke-WebRequest -UseBasicParsing -Uri (
        "$frontendBase/api/v1/projects/$projectId/ai-tasks/" +
        "$($marketing.data.jobId)/artifacts/result"
    ) -Headers $headers -TimeoutSec 15
    if ($marketingDownload.RawContentLength -ne (
        Get-Item -LiteralPath $sampleImage
    ).Length) {
        throw "Marketing result artifact content is invalid."
    }

    $headers["Idempotency-Key"] = "rerun-$suffix"
    $rerun = New-JsonPost (
        "$frontendBase/api/v1/projects/$projectId/marketing-contents/" +
        "$contentId/rerun"
    ) $headers @{ originalJobId = $marketing.data.jobId }
    $rerunJob = Wait-Job $rerun.data.jobId $headers
    if (
        $rerunJob.status -ne "SUCCEEDED" -or
        $rerun.data.jobId -eq $marketing.data.jobId
    ) {
        throw "Marketing rerun did not create a successful new job."
    }
    $rerunVersions = Invoke-RestMethod -Uri (
        "$frontendBase/api/v1/projects/$projectId/marketing-contents/" +
        "$contentId/versions"
    ) -Headers $headers -TimeoutSec 15
    if (
        $rerunVersions.data.Count -ne 3 -or
        $rerunVersions.data[1].analysisJobId -ne $marketing.data.jobId
    ) {
        throw "Rerun did not preserve the previous marketing result."
    }

    Write-Output (
        "Docker E2E passed: system=$($system.data.jobId), " +
        "artifact=$($artifact.data.jobId), marketing=$($marketing.data.jobId), " +
        "rerun=$($rerun.data.jobId)"
    )
} catch {
    Write-Error ("Docker E2E failed: " + $_.Exception.Message)
    try {
        & docker compose @composeFiles ps
        & docker compose @composeFiles logs --no-color --tail 200
    } catch {
        Write-Warning "Could not collect Docker Compose diagnostics."
    }
    exit 1
} finally {
    if (Test-Path -LiteralPath $sampleImage) {
        Remove-Item -LiteralPath $sampleImage -Force
    }
    if (-not $KeepEnvironment) {
        try {
            & docker compose @composeFiles down --volumes --remove-orphans
        } catch {
            Write-Warning "Docker Compose cleanup failed."
        }
    }
    Pop-Location
}
