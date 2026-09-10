#!/usr/bin/env python3
# Copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Regenerate every app icon from the master brand mark.

    python3 scripts/generate-icons.py <source.png>

The source is the full brand tile (dark background, 7X glyph). Everything else
is derived from it, so a rebrand is one file plus one command instead of hand
editing 20 PNGs:

  public/                    icon, adaptive foreground, favicon, splash
  android/.../mipmap-*/      ic_launcher, ic_launcher_round, ic_launcher_foreground

Requires Pillow. Android adaptive icons need the glyph inside the centre 66%
safe zone; that scaling is applied here rather than left to whoever redraws
the mark.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BG = (9, 9, 11)  # #09090B, brandbook dark background

# Android launcher icons per density bucket.
LAUNCHER_SIZES = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}
# Adaptive icon foreground layer: 108dp canvas.
FOREGROUND_SIZES = {
    "mdpi": 108,
    "hdpi": 162,
    "xhdpi": 216,
    "xxhdpi": 324,
    "xxxhdpi": 432,
}
# Glyph is scaled to this fraction of the adaptive canvas to stay in the safe zone.
ADAPTIVE_GLYPH_RATIO = 0.60
CORNER_RADIUS_RATIO = 0.225  # iOS-ish continuous curve approximation
# Inset applied after cropping to the artwork. Generated sources carry a corner
# watermark that overlaps the tile edge; the background is a flat colour, so
# trimming 6% off every side is invisible and removes it.
TRIM_RATIO = 0.06


def load_tile(source: Path) -> Image.Image:
    """Crop to the artwork itself, square it up and normalise the background.

    Generated images often arrive on a white canvas with a corner watermark;
    cropping to the non-white bounding box drops both. Remaining near-white
    pixels are repainted with the brand background so no white sliver survives
    the rounded-corner mask.
    """
    img = Image.open(source).convert("RGB")
    # Anything clearly darker than near-white is artwork.
    diff = img.point(lambda p: 255 if p < 235 else 0)
    bbox = diff.getbbox()
    if bbox:
        img = img.crop(bbox)
    inset = int(min(img.size) * TRIM_RATIO)
    img = img.crop((inset, inset, img.width - inset, img.height - inset))
    side = min(img.size)
    left = (img.width - side) // 2
    top = (img.height - side) // 2
    img = img.crop((left, top, left + side, top + side))

    r, g, b = img.split()
    lightest = ImageChops.darker(ImageChops.darker(r, g), b)
    white = lightest.point(lambda p: 255 if p > 225 else 0)
    img.paste(Image.new("RGB", img.size, BG), white)
    return img


def glyph_bbox(tile: Image.Image) -> tuple[int, int, int, int]:
    """Bounding box of pixels that differ from the dark background."""
    bg = Image.new("RGB", tile.size, BG)
    delta = ImageChops.difference(tile.convert("RGB"), bg)
    r, g, b = delta.split()
    strongest = ImageChops.lighter(ImageChops.lighter(r, g), b)
    box = strongest.point(lambda p: 255 if p > 40 else 0).getbbox()
    if not box:
        raise SystemExit("no glyph found: source does not look like a brand tile")
    return box


def rounded_tile(img: Image.Image, size: int) -> Image.Image:
    """Square artwork with rounded corners and transparency outside."""
    scaled = img.resize((size, size), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size - 1, size - 1],
        radius=int(size * CORNER_RADIUS_RATIO),
        fill=255,
    )
    out.paste(scaled, (0, 0), mask)
    return out


def circular(img: Image.Image, size: int) -> Image.Image:
    scaled = img.resize((size, size), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
    out.paste(scaled, (0, 0), mask)
    return out


def glyph_only(tile: Image.Image) -> Image.Image:
    box = glyph_bbox(tile)
    pad = int(max(box[2] - box[0], box[3] - box[1]) * 0.06)
    box = (box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad)
    return tile.crop(box).convert("RGBA")


def adaptive_foreground(glyph: Image.Image, size: int) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    target = int(size * ADAPTIVE_GLYPH_RATIO)
    scale = min(target / glyph.width, target / glyph.height)
    w, h = int(glyph.width * scale), int(glyph.height * scale)
    art = glyph.resize((w, h), Image.LANCZOS)
    canvas.paste(art, ((size - w) // 2, (size - h) // 2), art)
    return canvas


def splash(tile: Image.Image, width: int, height: int) -> Image.Image:
    canvas = Image.new("RGB", (width, height), BG)
    target = int(min(width, height) * 0.42)
    scale = target / tile.width
    art = tile.resize((target, int(tile.height * scale)), Image.LANCZOS)
    canvas.paste(art, ((width - art.width) // 2, (height - art.height) // 2))
    return canvas


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)
    print(f"  {path.relative_to(ROOT)}")


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    tile = rounded_tile(load_tile(Path(sys.argv[1])), 1024)
    glyph = glyph_only(tile)

    print("public/")
    save(tile, ROOT / "public/icon.png")
    save(tile, ROOT / "public/logo-tile.png")
    save(rounded_tile(tile, 180), ROOT / "public/favicon.png")
    save(adaptive_foreground(glyph, 1024), ROOT / "public/adaptive-icon.png")
    save(splash(tile, 1242, 2732), ROOT / "public/splash.png")

    print("android/")
    res = ROOT / "android/app/src/main/res"
    for bucket, size in LAUNCHER_SIZES.items():
        folder = res / f"mipmap-{bucket}"
        save(rounded_tile(tile, size), folder / "ic_launcher.png")
        save(circular(tile, size), folder / "ic_launcher_round.png")
    for bucket, size in FOREGROUND_SIZES.items():
        save(adaptive_foreground(glyph, size), res / f"mipmap-{bucket}/ic_launcher_foreground.png")


if __name__ == "__main__":
    main()
