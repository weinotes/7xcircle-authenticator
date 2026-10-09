"""Generate the 1200x630 Open Graph share image for the download page.

Brand palette mirrors download/index.html (--bg #0f1729, --brand-a #6366f1,
--brand-b #a855f7). Run from the repo root:

    python3 scripts/generate-og-image.py

Writes download/og-image.png.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "download" / "og-image.png"
ICON = ROOT / "download" / "app-icon.png"

W, H = 1200, 630
BG = (15, 23, 41)
TEXT = (255, 255, 255)
MUTED = (203, 213, 225)
DIM = (156, 163, 175)

# Hiragino Sans GB carries both Chinese and Latin; index 1 is the heavier weight.
FONT_CANDIDATES = [
    ("/System/Library/Fonts/Hiragino Sans GB.ttc", 1),
    ("/System/Library/Fonts/Hiragino Sans GB.ttc", 0),
    ("/System/Library/Fonts/STHeiti Medium.ttc", 0),
    ("/System/Library/Fonts/Supplemental/Arial Unicode.ttf", 0),
]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path, index in FONT_CANDIDATES:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size, index=index)
            except OSError:
                continue
    raise SystemExit("no CJK-capable font found")


def main() -> None:
    img = Image.new("RGB", (W, H), BG)

    # Brand glow: indigo centre-top, violet upper-right, both heavily blurred.
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse([W // 2 - 520, -470, W // 2 + 520, 250], fill=(99, 102, 241, 155))
    od.ellipse([W - 430, -180, W + 250, 330], fill=(168, 85, 247, 95))
    overlay = overlay.filter(ImageFilter.GaussianBlur(150))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    draw = ImageDraw.Draw(img)

    # App icon, rounded like the page's .app-icon.
    icon_size = 148
    icon = Image.open(ICON).convert("RGBA").resize(
        (icon_size, icon_size), Image.Resampling.LANCZOS
    )
    mask = Image.new("L", (icon_size, icon_size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, icon_size - 1, icon_size - 1], radius=34, fill=255)
    ix, iy = 96, 118
    img.paste(icon, (ix, iy), mask)
    draw.rounded_rectangle(
        [ix, iy, ix + icon_size - 1, iy + icon_size - 1],
        radius=34, outline=(42, 59, 92), width=2,
    )

    title = load_font(70)
    sub = load_font(36)
    meta = load_font(27)

    tx = ix + icon_size + 46
    draw.text((tx, 150), "7X Circle 验证器", font=title, fill=TEXT)
    draw.text((tx, 245), "离线 TOTP / HOTP 双因素验证器", font=sub, fill=MUTED)

    # Separator rule then the factual feature line.
    draw.line([(tx, 315), (W - 96, 315)], fill=(42, 59, 92), width=2)
    draw.text((tx, 345), "令牌全部在本机计算 · 应用不发起任何网络请求", font=meta, fill=DIM)
    draw.text((tx, 390), "Android 8.0+ 正式签名 APK · Apache-2.0 开源", font=meta, fill=DIM)

    # Footer: canonical host, so a shared card always shows where it came from.
    draw.text((96, 540), "auth.7xcircle.com", font=meta, fill=(99, 102, 241))

    img.save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes, {W}x{H})")


if __name__ == "__main__":
    main()
