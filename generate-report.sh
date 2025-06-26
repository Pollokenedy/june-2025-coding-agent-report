#!/bin/bash

# Function to process a single directory
process_directory() {
    local dir_path="$1"
    local dir_name=$(basename "$dir_path")
    
    echo "\n\n============================================"
    echo "Processing project: $dir_name"
    echo "Path: $dir_path"
    echo "=========================================="
    
    # Change to the directory
    cd "$dir_path" || {
        echo "Error: Cannot change to directory $dir_path"
        return 1
    }
    
    # Check if assessment file exists
    local needs_assessment=false
    if [[ ! -f "assessment.md" && ! -f "assessment-consise.md" ]]; then
        needs_assessment=true
        echo "No assessment file found. Will generate assessment."
    else
        echo "Assessment file already exists."
    fi
    
    # Check if screenshot exists
    local needs_screenshot=false
    if [[ ! -f "index-${dir_name}.png" ]]; then
        needs_screenshot=true
        echo "No screenshot found. Will generate screenshot."
    else
        echo "Screenshot already exists."
    fi
    
    # Update GitHub description
    echo "\nStep 0: Updating GitHub description..."
    gh repo edit --description "June 25 Agent Evaluation" 2>/dev/null || echo "Warning: Failed to update GitHub description"
    
    # Generate assessment if needed
    if [ "$needs_assessment" = true ]; then
        echo "\nStep 1: Generating code assessment..."
        if command -v pnpx >/dev/null 2>&1 && command -v run-prompt >/dev/null 2>&1; then
            pnpx repomix --ignore "node_modules" --stdout | run-prompt code/high-level-review-consise | tee assessment-consise.md
            if [ $? -ne 0 ]; then
                echo "Warning: Failed to generate assessment for $dir_name"
            fi
        else
            echo "Warning: pnpx or run-prompt not available, skipping assessment generation"
        fi
    else
        echo "\nStep 1: Skipping assessment generation (file already exists)"
    fi
    
    # Generate screenshot if needed
    if [ "$needs_screenshot" = true ]; then
        # Check if Dockerfile exists
        if [[ ! -f "Dockerfile" ]]; then
            echo "Warning: No Dockerfile found in $dir_name, skipping screenshot generation"
            return 0
        fi
        
        echo "\nStep 2: Building Docker image..."
        docker build -t "$dir_name" . 2>/dev/null
        if [ $? -ne 0 ]; then
            echo "Warning: Failed to build Docker image for $dir_name"
            return 0
        fi
        
        echo "\nStep 3: Starting Docker container..."
        # Stop any existing container with the same name
        docker stop "${dir_name}-temp" 2>/dev/null
        docker rm "${dir_name}-temp" 2>/dev/null
        
        docker run -d --name "${dir_name}-temp" -p 3000:3000 "$dir_name" 2>/dev/null
        if [ $? -ne 0 ]; then
            echo "Warning: Failed to start Docker container for $dir_name"
            return 0
        fi
        
        # Wait for container to start
        echo "Waiting for container to start..."
        sleep 10
        
        echo "\nStep 4: Taking screenshot..."
        if command -v shot-scraper >/dev/null 2>&1; then
            shot-scraper shot -w 600 -o "index-${dir_name}.png" http://localhost:3000 2>/dev/null
            if [ $? -ne 0 ]; then
                echo "Warning: Failed to take screenshot for $dir_name"
            fi
        else
            echo "Warning: shot-scraper not available, skipping screenshot"
        fi
        
        # Cleanup
        echo "\nCleaning up container..."
        docker stop "${dir_name}-temp" 2>/dev/null
        docker rm "${dir_name}-temp" 2>/dev/null
    else
        echo "\nStep 2-4: Skipping Docker build and screenshot (file already exists)"
    fi
    
    echo "\nCompleted processing: $dir_name"
}

# Main script logic
if [[ "$1" == "--all" ]]; then
    echo "Processing all idears directories..."
    
    # Find all idears* directories in the parent directory
    base_dir="$(dirname "$(pwd)")"
    if [[ "$(basename "$(pwd)")" == "The-Focus-AI" ]]; then
        base_dir="$(pwd)"
    fi
    
    # Get all idears directories
    idears_dirs=()
    while IFS= read -r -d '' dir; do
        idears_dirs+=("$dir")
    done < <(find "$base_dir" -maxdepth 1 -type d -name "idears*" -print0 | sort -z)
    
    if [ ${#idears_dirs[@]} -eq 0 ]; then
        echo "No idears* directories found in $base_dir"
        exit 1
    fi
    
    echo "Found ${#idears_dirs[@]} idears directories:"
    for dir in "${idears_dirs[@]}"; do
        echo "  - $(basename "$dir")"
    done
    
    # Process each directory
    for dir in "${idears_dirs[@]}"; do
        process_directory "$dir"
    done
    
    echo "\n\n============================================"
    echo "All directories processed!"
    echo "=========================================="
    
else
    # Original single directory processing
    DIR_NAME=$(basename "$(pwd)")
    
    echo "Generating report for project: $DIR_NAME"
    echo "========================================"
    
    # Step 0: Update GitHub description
    echo "Step 0: Updating GitHub description..."
    gh repo edit --description "June 25 Agent Evaluation"
    
    if [ $? -ne 0 ]; then
        echo "Warning: Failed to update GitHub description"
    fi
    
    # Step 1: Generate code assessment
    echo "\nStep 1: Generating code assessment..."
    pnpx repomix --ignore "node_modules" --stdout | run-prompt code/high-level-review-consise | tee assessment-consise.md
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to generate assessment"
        exit 1
    fi
    
    # Step 2: Build Docker image
    echo "\nStep 2: Building Docker image..."
    docker build -t "$DIR_NAME" .
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to build Docker image"
        exit 1
    fi
    
    # Step 3: Run Docker container in background
    echo "\nStep 3: Starting Docker container..."
    docker run -d --name "${DIR_NAME}-temp" -p 3000:3000 "$DIR_NAME"
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to start Docker container"
        exit 1
    fi
    
    # Wait a moment for the container to start
    echo "Waiting for container to start..."
    sleep 5
    
    # Step 4: Take screenshot
    echo "\nStep 4: Taking screenshot..."
    shot-scraper shot -w 600 -o "index-${DIR_NAME}.png" http://localhost:3000
    
    if [ $? -ne 0 ]; then
        echo "Warning: Failed to take screenshot"
    fi
    
    # Cleanup: Stop and remove the container
    echo "\nCleaning up..."
    docker stop "${DIR_NAME}-temp"
    docker rm "${DIR_NAME}-temp"
    
    echo "\nReport generation complete!"
    echo "Files generated:"
    echo "  - assessment-consise.md"
    echo "  - index-${DIR_NAME}.png"
    echo "  - Docker image: ${DIR_NAME}"
fi
