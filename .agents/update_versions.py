#!/usr/bin/env python3
import argparse
import json
import os
import re
import subprocess
import sys

SERVICES = {
    "solutis-agile-frontend": {"type": "json", "file": "package.json"},
    "solutis-sync": {"type": "toml", "file": "pyproject.toml"},
    "solutis_manager_back": {"type": "toml", "file": "pyproject.toml"},
    "solutis_procurement": {"type": "toml", "file": "pyproject.toml"},
    "solutis_report": {"type": "toml", "file": "pyproject.toml"},
}


def run_git_command(args):
    """Helper to run git commands and return output."""
    try:
        res = subprocess.run(
            ["git"] + args,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True,
        )
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running git {' '.join(args)}: {e.stderr}", file=sys.stderr)
        return None


def get_modified_files(commit_ref="HEAD", local_only=False):
    """Retrieve list of modified files."""
    if local_only:
        # Unstaged changes
        unstaged = run_git_command(["diff", "--name-only"])
        # Staged changes
        staged = run_git_command(["diff", "--cached", "--name-only"])
        # Untracked files
        untracked = run_git_command(["ls-files", "--others", "--exclude-standard"])

        files = []
        if unstaged:
            files.extend(unstaged.splitlines())
        if staged:
            files.extend(staged.splitlines())
        if untracked:
            files.extend(untracked.splitlines())
        return list(set(files))

    # Verify commit exists
    if not run_git_command(["rev-parse", "--verify", commit_ref]):
        return []

    # Get changes in the specified commit
    out = run_git_command(
        ["diff-tree", "--no-commit-id", "--name-only", "-r", commit_ref]
    )
    if out is None:
        # Fallback if no parent or diff-tree fails (e.g. initial commit)
        out = run_git_command(["show", "--name-only", "--pretty=format:", commit_ref])

    if out:
        return [line.strip() for line in out.splitlines() if line.strip()]
    return []


def get_commit_message(commit_ref="HEAD"):
    """Retrieve commit message for the given reference."""
    out = run_git_command(["log", "-1", "--pretty=%B", commit_ref])
    return out if out else ""


def determine_bump_type(commit_message):
    """Parse conventional commit pattern to determine bump type."""
    if not commit_message:
        return "patch"

    # Breaking changes check
    if "BREAKING CHANGE" in commit_message:
        return "major"

    # Check prefix with exclamation or standard type
    # e.g., feat(auth)!: login or fix: bad query
    pattern = re.compile(r"^(\w+)(?:\([^)]+\))?(!?):")
    match = pattern.match(commit_message.strip())
    if match:
        c_type = match.group(1).lower()
        has_excl = match.group(2) == "!"

        if has_excl:
            return "major"
        if c_type == "feat":
            return "minor"
        elif c_type in [
            "fix",
            "chore",
            "refactor",
            "style",
            "docs",
            "test",
            "perf",
            "build",
            "ci",
        ]:
            return "patch"

    # Quick startswith fallback
    lower_msg = commit_message.lower().strip()
    if lower_msg.startswith("feat"):
        return "minor"
    elif any(
        lower_msg.startswith(p)
        for p in [
            "fix",
            "chore",
            "refactor",
            "style",
            "docs",
            "test",
            "perf",
            "build",
            "ci",
        ]
    ):
        return "patch"

    return "patch"


def bump_version(current_version, bump_type):
    """Increment SemVer string."""
    prefix = ""
    if current_version.startswith("v"):
        prefix = "v"
        current_version = current_version[1:]

    parts = current_version.split(".")
    # Ensure we have at least 3 parts (major.minor.patch)
    while len(parts) < 3:
        parts.append("0")

    try:
        major = int(parts[0])
        minor = int(parts[1])
        patch = int(parts[2])
    except ValueError:
        # Fallback if non-integer format
        return current_version

    if bump_type == "major":
        major += 1
        minor = 0
        patch = 0
    elif bump_type == "minor":
        minor += 1
        patch = 0
    else:  # patch
        patch += 1

    return f"{prefix}{major}.{minor}.{patch}"


def get_current_version(service_dir, service_cfg):
    """Parse the current version from the service files."""
    file_type = service_cfg["type"]
    file_name = service_cfg["file"]
    file_path = os.path.join(service_dir, file_name)

    if not os.path.exists(file_path):
        return None

    if file_type == "json":
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("version")
        except Exception as e:
            print(f"Error reading package.json for {service_dir}: {e}", file=sys.stderr)
            return None
    elif file_type == "toml":
        # Safe read of toml version under [project]
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                in_project = False
                for line in f:
                    stripped = line.strip()
                    if stripped.startswith("[project]"):
                        in_project = True
                    elif stripped.startswith("[") and stripped != "[project]":
                        in_project = False

                    if in_project:
                        # Match version = "1.2.3"
                        match = re.match(r'^\s*version\s*=\s*["\']([^"\']+)["\']', line)
                        if match:
                            return match.group(1)
        except Exception as e:
            print(
                f"Error reading pyproject.toml for {service_dir}: {e}", file=sys.stderr
            )
            return None

    return None


def update_json_version(file_path, new_version):
    """Update version in package.json preserving structure and indentation."""
    with open(file_path, "r", encoding="utf-8") as f:
        # Detect indentation
        content = f.read()
        indent = 2
        # Simple detection of 2 vs 4 spaces indentation
        if "\n    " in content:
            indent = 4
        elif "\n\t" in content:
            indent = "\t"

        f.seek(0)
        data = json.load(f)

    data["version"] = new_version

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=indent)
        # Ensure trailing newline is kept
        f.write("\n")


def update_toml_version(file_path, new_version):
    """Update version in pyproject.toml line by line to keep formatting/comments."""
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    in_project_section = False
    updated = False
    new_lines = []

    version_re = re.compile(r'^(\s*version\s*=\s*[\'"])([^\'"]+)([\'"].*)$')

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("[project]"):
            in_project_section = True
        elif stripped.startswith("[") and stripped != "[project]":
            in_project_section = False

        if in_project_section and not updated:
            match = version_re.match(line)
            if match:
                line = f"{match.group(1)}{new_version}{match.group(3)}\n"
                updated = True
        new_lines.append(line)

    if not updated:
        raise ValueError(f"Could not find [project] version in {file_path}")

    with open(file_path, "w", encoding="utf-8", newline="") as f:
        f.writelines(new_lines)


def main():
    parser = argparse.ArgumentParser(
        description="Version update workflow for monorepo services."
    )
    parser.add_argument(
        "--commit",
        default="HEAD",
        help="Git commit hash/ref to analyze changes (default: HEAD).",
    )
    parser.add_argument(
        "--local",
        action="store_true",
        help="Analyze current local uncommitted changes (staged and unstaged) instead of a commit.",
    )
    parser.add_argument(
        "--bump-type",
        choices=["major", "minor", "patch"],
        help="Force a specific SemVer bump type (major, minor, patch).",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Update the version of all services regardless of git changes.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what versions would be updated without writing changes to files.",
    )

    args = parser.parse_args()

    # Determine workspace root (the directory containing .agents)
    # The script lives in .agents/
    script_dir = os.path.dirname(os.path.realpath(__file__))
    workspace_root = os.path.dirname(script_dir)

    print(f"💼 Monorepo Root: {workspace_root}")

    # Determine modified services
    changed_services = set()
    if args.all:
        changed_services = set(SERVICES.keys())
        print("🔄 Option --all active. Targeting all monorepo services.")
    else:
        # Determine files changed
        changed_files = get_modified_files(
            commit_ref=args.commit, local_only=args.local
        )
        if args.local:
            print(
                f"🔍 Analyzing local uncommitted changes. Found {len(changed_files)} changed files."
            )
        else:
            print(
                f"🔍 Analyzing commit '{args.commit}'. Found {len(changed_files)} changed files."
            )

        for f in changed_files:
            # Match top-level service directories
            parts = f.split("/")
            if len(parts) > 0 and parts[0] in SERVICES:
                changed_services.add(parts[0])

    if not changed_services:
        print("⏭️ No modified services found. Nothing to update.")
        return 0

    # Determine bump type
    bump_type = args.bump_type
    if not bump_type:
        if args.local:
            bump_type = "patch"
            print(
                "📝 Local changes detected without explicit bump type. Defaulting to: patch"
            )
        else:
            commit_msg = get_commit_message(args.commit)
            bump_type = determine_bump_type(commit_msg)
            print(f"📝 Commit message:\n---\n{commit_msg.strip()}\n---")
            print(f"⚙️ Auto-detected bump type: {bump_type}")
    else:
        print(f"⚙️ Manually requested bump type: {bump_type}")

    # Update services
    print("\n📦 Updating services:")
    updates_made = 0
    for service in sorted(list(changed_services)):
        service_cfg = SERVICES[service]
        service_path = os.path.join(workspace_root, service)

        current_version = get_current_version(service_path, service_cfg)
        if not current_version:
            print(f"  ❌ {service}: Version file not found or unparseable. Skipping.")
            continue

        new_version = bump_version(current_version, bump_type)
        print(f"  ✨ {service}: {current_version} ➡️ {new_version}")

        if not args.dry_run:
            file_path = os.path.join(service_path, service_cfg["file"])
            try:
                if service_cfg["type"] == "json":
                    update_json_version(file_path, new_version)
                else:
                    update_toml_version(file_path, new_version)
                print(f"     ✅ Saved successfully.")
                updates_made += 1
            except Exception as e:
                print(f"     ❌ Failed to save version update: {e}", file=sys.stderr)
        else:
            print(f"     🔍 [DRY RUN] Would update version file.")

    if args.dry_run:
        print("\n🔍 Dry-run complete. No changes made.")
    else:
        print(f"\n✅ Finished. Updated {updates_made} service(s).")

    return 0


if __name__ == "__main__":
    sys.exit(main())
