#!/usr/bin/env python3
"""Trace the approved custom wordmark contours into self-contained SVGs."""

from __future__ import annotations

import argparse
import hashlib
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path


TEXT = "China, in Fact"
INK = "#1D1D1A"
CINNABAR = "#B43A2F"
RICE = "#F4F0E7"
SVG_NS = "http://www.w3.org/2000/svg"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--transparent-out", type=Path, required=True)
    parser.add_argument("--rice-out", type=Path, required=True)
    return parser.parse_args()


def run(command: list[str]) -> None:
    subprocess.run(command, check=True, capture_output=True, text=True)


def dimensions(source: Path) -> tuple[int, int]:
    result = subprocess.run(
        ["identify", "-format", "%w %h", str(source)],
        check=True,
        capture_output=True,
        text=True,
    )
    width, height = result.stdout.split()
    return int(width), int(height)


def trace_mask(mask: Path, output: Path) -> None:
    run(
        [
            "potrace",
            str(mask),
            "--svg",
            "--output",
            str(output),
            "--turdsize",
            "8",
            "--alphamax",
            "1",
            "--opttolerance",
            "0.1",
        ]
    )


def extract_trace(svg_path: Path) -> tuple[str, list[str]]:
    root = ET.parse(svg_path).getroot()
    group = root.find(f"{{{SVG_NS}}}g")
    if group is None:
        raise RuntimeError(f"No traced group in {svg_path}")
    transform = group.attrib["transform"]
    paths = [node.attrib["d"] for node in group.findall(f"{{{SVG_NS}}}path")]
    if not paths:
        raise RuntimeError(f"No traced paths in {svg_path}")
    return transform, paths


def render_svg(
    width: int,
    height: int,
    source_sha: str,
    ink_trace: tuple[str, list[str]],
    accent_trace: tuple[str, list[str]],
    background: str | None,
) -> str:
    background_rect = f'  <rect width="{width}" height="{height}" fill="{background}"/>\n' if background else ""
    groups: list[str] = []
    for fill, (transform, paths) in ((INK, ink_trace), (CINNABAR, accent_trace)):
        markup = "\n".join(f'    <path d="{path}"/>' for path in paths)
        groups.append(f'  <g transform="{transform}" fill="{fill}" stroke="none">\n{markup}\n  </g>')
    group_markup = "\n".join(groups)
    return f'''<svg xmlns="{SVG_NS}" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{TEXT}">
  <title>{TEXT}</title>
  <metadata>Contour trace of the approved custom serif wordmark. Source raster sha256: {source_sha}. Accent letters read hi, act.</metadata>
{background_rect}{group_markup}
</svg>
'''


def main() -> None:
    args = parse_args()
    source_sha = hashlib.sha256(args.source.read_bytes()).hexdigest()
    width, height = dimensions(args.source)

    with tempfile.TemporaryDirectory(prefix="china-in-fact-vector-") as temp_dir:
        temp = Path(temp_dir)
        all_mask = temp / "all.pbm"
        accent_mask = temp / "accent.pbm"
        ink_mask = temp / "ink.pbm"
        accent_svg = temp / "accent.svg"
        ink_svg = temp / "ink.svg"

        # The approved raster contains a dark neutral wordmark and a warm accent.
        # Segment the accent by channel difference so the original custom contours,
        # rather than a substitute font, remain the source of truth.
        run(
            [
                "magick",
                str(args.source),
                "-colorspace",
                "sRGB",
                "-fx",
                "((r-g)>0.08 && (r-b)>0.10) ? 0 : 1",
                "-threshold",
                "50%",
                str(accent_mask),
            ]
        )
        run(
            [
                "magick",
                str(args.source),
                "-colorspace",
                "Gray",
                "-threshold",
                "85%",
                str(all_mask),
            ]
        )
        run(
            [
                "magick",
                str(all_mask),
                "(",
                str(accent_mask),
                "-negate",
                ")",
                "-compose",
                "Lighten",
                "-composite",
                "-threshold",
                "50%",
                str(ink_mask),
            ]
        )

        trace_mask(ink_mask, ink_svg)
        trace_mask(accent_mask, accent_svg)
        ink_trace = extract_trace(ink_svg)
        accent_trace = extract_trace(accent_svg)

    args.transparent_out.parent.mkdir(parents=True, exist_ok=True)
    args.transparent_out.write_text(
        render_svg(width, height, source_sha, ink_trace, accent_trace, None),
        encoding="utf-8",
    )
    args.rice_out.write_text(
        render_svg(width, height, source_sha, ink_trace, accent_trace, RICE),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
