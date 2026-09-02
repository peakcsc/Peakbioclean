from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import math

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dashboard" / "peakbioclean-animated-avatar.gif"
SRC = ROOT / "assets" / "logo" / "logo-color-2.png"

SIZE = 512
FRAMES = 40
BG = (6, 18, 15, 255)
GREEN = (38, 198, 132, 255)


def cover_square_logo():
    logo = Image.open(SRC).convert("RGBA")
    bbox = logo.getbbox()
    logo = logo.crop(bbox)
    scale = min(360 / logo.width, 150 / logo.height)
    logo = logo.resize((int(logo.width * scale), int(logo.height * scale)), Image.Resampling.LANCZOS)
    return logo


def make_frame(i, logo):
    t = i / FRAMES
    img = Image.new("RGBA", (SIZE, SIZE), BG)
    draw = ImageDraw.Draw(img)

    glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    pulse = int(24 + 18 * math.sin(t * math.tau))
    gd.ellipse((72 - pulse, 72 - pulse, SIZE - 72 + pulse, SIZE - 72 + pulse), outline=(38, 198, 132, 110), width=8)
    glow = glow.filter(ImageFilter.GaussianBlur(12))
    img.alpha_composite(glow)

    start = 360 * t
    draw.arc((56, 56, SIZE - 56, SIZE - 56), start=start, end=start + 245, fill=GREEN, width=12)
    draw.arc((82, 82, SIZE - 82, SIZE - 82), start=360 - start, end=360 - start + 120, fill=(220, 28, 32, 255), width=7)

    bob = int(5 * math.sin(t * math.tau))
    x = (SIZE - logo.width) // 2
    y = (SIZE - logo.height) // 2 + bob
    shadow = Image.new("RGBA", logo.size, (0, 0, 0, 0))
    shadow.alpha_composite(logo)
    shadow = shadow.filter(ImageFilter.GaussianBlur(9))
    img.alpha_composite(shadow, (x, y + 9))
    img.alpha_composite(logo, (x, y))

    mask = Image.new("L", (SIZE, SIZE), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((0, 0, SIZE, SIZE), fill=255)
    img.putalpha(mask)
    return img.convert("P", palette=Image.Palette.ADAPTIVE, colors=128)


def main():
    logo = cover_square_logo()
    frames = [make_frame(i, logo) for i in range(FRAMES)]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(OUT, save_all=True, append_images=frames[1:], duration=60, loop=0, optimize=True, disposal=2)
    print(OUT)


if __name__ == "__main__":
    main()
