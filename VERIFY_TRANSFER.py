"""Read-only integrity check for an extracted The Family transfer package."""

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys


def file_sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def verify(project_root, manifest):
    root = Path(project_root).resolve()
    entries = manifest.get("files", [])
    issues = []
    verified = 0
    seen = set()
    if manifest.get("format") != "the-family-transfer-v1":
        raise ValueError("Unsupported transfer manifest format")
    if not isinstance(entries, list) or manifest.get("file_count") != len(entries):
        raise ValueError("Manifest file count is inconsistent")
    for entry in entries:
        relative = entry.get("path", "")
        if (
            not isinstance(relative, str)
            or not relative
            or "\\" in relative
            or ":" in relative
            or any(part in ("", ".", "..") for part in relative.split("/"))
        ):
            issues.append({"path": str(relative), "reason": "unsafe_path"})
            continue
        if relative.casefold() in seen:
            issues.append({"path": relative, "reason": "duplicate_path"})
            continue
        seen.add(relative.casefold())
        candidate = root.joinpath(*relative.split("/"))
        try:
            candidate.resolve().relative_to(root)
        except (ValueError, OSError, RuntimeError):
            issues.append({"path": relative, "reason": "outside_project"})
            continue
        if not candidate.is_file():
            issues.append({"path": relative, "reason": "missing_file"})
            continue
        expected_hash = entry.get("sha256", "")
        if (
            type(entry.get("bytes")) is not int
            or entry["bytes"] < 0
            or not isinstance(expected_hash, str)
            or not re.fullmatch(r"[0-9a-f]{64}", expected_hash)
        ):
            issues.append({"path": relative, "reason": "invalid_metadata"})
            continue
        try:
            if candidate.stat().st_size != entry["bytes"]:
                issues.append({"path": relative, "reason": "size_mismatch"})
            elif file_sha256(candidate) != expected_hash:
                issues.append({"path": relative, "reason": "sha256_mismatch"})
            else:
                verified += 1
        except OSError:
            issues.append({"path": relative, "reason": "unreadable_file"})
    return {
        "status": "FAIL" if issues else "PASS",
        "verified_files": verified,
        "expected_files": len(entries),
        "issues": issues,
    }


def main():
    root = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=root / "TRANSFER_MANIFEST.json")
    args = parser.parse_args()
    try:
        manifest = json.loads(args.manifest.read_text(encoding="utf-8-sig"))
        result = verify(root, manifest)
    except (OSError, ValueError, TypeError, AttributeError) as error:
        print(json.dumps({"status": "FAIL", "error": str(error)}, ensure_ascii=True))
        return 2
    print(json.dumps(result, ensure_ascii=True, indent=2))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
