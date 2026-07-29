#!/bin/bash
set -e

# Configured services list: "directory_name|container_name|compose_service|version_file_type"
SERVICES=(
  "solutis-agile-frontend|solutis-agile-frontend-prod|agile-front|json"
  "solutis-sync|solutis-sync-prod|solutis-sync|toml"
  "solutis_manager_back|solutis-manager-back-prod|agile-back|toml"
  "solutis_procurement|solutis-procurement-prod|solutis-procurement|toml"
  "solutis_report|solutis-report-prod|solutis-report|toml"
)

get_local_version() {
  local service_dir="$1"
  local file_type="$2"
  if [ "$file_type" = "json" ]; then
    python3.11 -c "import json; print(json.load(open('$service_dir/package.json'))['version'])"
  else
    python3.11 -c "import tomllib; print(tomllib.load(open('$service_dir/pyproject.toml', 'rb'))['project']['version'])"
  fi
}

get_running_tag() {
  local container_name="$1"
  local image
  if image=$(docker inspect --format='{{.Config.Image}}' "$container_name" 2>/dev/null); then
    echo "${image##*:}"
  else
    echo "none"
  fi
}

# Fetch local versions and export them so docker compose substitution works
FRONTEND_TAG=$(get_local_version "solutis-agile-frontend" "json")
SYNC_TAG=$(get_local_version "solutis-sync" "toml")
MANAGER_TAG=$(get_local_version "solutis_manager_back" "toml")
PROCUREMENT_TAG=$(get_local_version "solutis_procurement" "toml")
REPORT_TAG=$(get_local_version "solutis_report" "toml")

export FRONTEND_TAG SYNC_TAG MANAGER_TAG PROCUREMENT_TAG REPORT_TAG

echo "🔍 Local Project Versions:"
echo "  Frontend:    $FRONTEND_TAG"
echo "  Sync:        $SYNC_TAG"
echo "  Manager:     $MANAGER_TAG"
echo "  Procurement: $PROCUREMENT_TAG"
echo "  Report:      $REPORT_TAG"
echo ""

# Iterate services and check for updates
for item in "${SERVICES[@]}"; do
  IFS="|" read -r dir_name container_name compose_service file_type <<< "$item"

  local_version=$(get_local_version "$dir_name" "$file_type")
  running_tag=$(get_running_tag "$container_name")

  echo "Checking service: $compose_service ($container_name)"
  echo "  Local Version:  $local_version"
  echo "  Running Tag:    $running_tag"

  if [ "$local_version" != "$running_tag" ]; then
    echo "⚡ Version changed! Deploying $compose_service with version $local_version..."

    if ! command -v docker >/dev/null 2>&1; then
      echo "⚠️ Docker is not available in this environment. [DRY-RUN] Rebuilding and deploying container $container_name..."
    else
      # Build only the changed service
      docker compose -f docker-compose.prod.yml build "$compose_service"

      if [ "$compose_service" = "agile-back" ] || [ "$compose_service" = "solutis-procurement" ]; then
        echo "🔄 Executing database migrations and starting container for $compose_service..."
      fi

      # Recreate container without touching others
      docker compose -f docker-compose.prod.yml up -d --no-deps "$compose_service"

      echo "✅ Successfully deployed $compose_service!"
    fi
  else
    echo "⏭️ No changes detected. Skipping $compose_service."
  fi
  echo ""
done
