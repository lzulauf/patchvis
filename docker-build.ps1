# Build and serve the example
param(
    [switch]$Serve,
    [switch]$Build
)

if ($Serve) {
    Write-Host "Building Docker image..."
    docker build -t patchvis-builder .
    
    Write-Host "Starting server on http://localhost:8080"
    Write-Host "Press Ctrl+C to stop"
    docker run -p 8080:8080 --name patchvis-server patchvis-builder
} 
elseif ($Build) {
    Write-Host "Building Docker image..."
    docker build -t patchvis-builder .
    
    Write-Host "Extracting built files..."
    docker create --name patchvis-temp patchvis-builder
    docker cp patchvis-temp:/app/dist ./dist
    docker rm patchvis-temp
    
    Write-Host "Build complete! Built files are in ./dist"
}
else {
    Write-Host "Usage:"
    Write-Host "  .\docker-build.ps1 -Serve   # Build and serve example on http://localhost:8080"
    Write-Host "  .\docker-build.ps1 -Build   # Build and extract dist files"
}
