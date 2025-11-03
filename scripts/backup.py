#!/usr/bin/env python3
"""
Simple backup utility.

Creates timestamped archives for one or more source directories/files.

Examples:
    python scripts/backup.py ./config ./docs --dest backups
    python scripts/backup.py ./server.js --prefix project --format tar.gz
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
from pathlib import Path
import shutil
import sys
from typing import Iterable, List


SUPPORTED_FORMATS = {"zip", "tar", "gztar", "bztar", "xztar"}


def parse_args(argv: List[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create timestamped archives for the provided sources."
    )
    parser.add_argument(
        "sources",
        nargs="+",
        help="Files or directories to archive."
    )
    parser.add_argument(
        "--dest",
        default="backups",
        help="Output directory for the archives (default: %(default)s).",
    )
    parser.add_argument(
        "--format",
        default="zip",
        choices=sorted(SUPPORTED_FORMATS),
        help="Archive format (default: %(default)s).",
    )
    parser.add_argument(
        "--prefix",
        default="backup",
        help="Filename prefix for generated archives (default: %(default)s).",
    )
    parser.add_argument(
        "--timestamp-format",
        default="%Y%m%d-%H%M%S",
        help="strftime-compatible format for timestamps appended to filenames.",
    )
    return parser.parse_args(argv)


def ensure_destination(dest: Path) -> None:
    dest.mkdir(parents=True, exist_ok=True)


def timestamp(ts_format: str) -> str:
    return dt.datetime.now().strftime(ts_format)


def normalize_sources(raw_sources: Iterable[str]) -> List[Path]:
    normalized: List[Path] = []
    for item in raw_sources:
        path = Path(item).resolve()
        if not path.exists():
            raise FileNotFoundError(f"Source does not exist: {path}")
        normalized.append(path)
    return normalized


def archive_source(
    source: Path,
    dest_dir: Path,
    archive_format: str,
    prefix: str,
    ts_format: str,
) -> Path:
    ts = timestamp(ts_format)
    safe_name = source.name.replace(os.sep, "_")
    archive_base = dest_dir / f"{prefix}_{safe_name}_{ts}"
    archive_path = shutil.make_archive(
        base_name=str(archive_base),
        format=archive_format,
        root_dir=str(source.parent) if source.is_file() else str(source),
        base_dir=source.name if source.is_file() else None,
    )
    return Path(archive_path)


def main(argv: List[str]) -> int:
    args = parse_args(argv)
    dest_dir = Path(args.dest).resolve()
    ensure_destination(dest_dir)

    try:
        sources = normalize_sources(args.sources)
    except FileNotFoundError as exc:
        print(f"[error] {exc}", file=sys.stderr)
        return 1

    created_archives: List[Path] = []
    for source in sources:
        try:
            archive = archive_source(
                source=source,
                dest_dir=dest_dir,
                archive_format=args.format,
                prefix=args.prefix,
                ts_format=args.timestamp_format,
            )
            created_archives.append(archive)
            print(f"[ok] {source} -> {archive}")
        except Exception as exc:  # noqa: BLE001
            print(f"[error] Failed to archive {source}: {exc}", file=sys.stderr)

    return 0 if created_archives else 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
