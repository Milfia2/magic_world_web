"""One-time web asset preparation. Originals under source/ are never modified.
Run with Python + Pillow when source artwork changes; commit assets/ afterwards.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets"
OUT.mkdir(exist_ok=True)
FILES = {
    "atrium": "atrium.png", "library": "library.png", "classroom": "classroom.png",
    "office": "office.png", "observatory": "observatory.png", "dorms": "dormitory_outside.png",
    "forest": "Forbidden_Woods.png", "village": "Hogsmeade.png", "pitch": "Quidditch_Pitch.png",
    "map": "item/map.png", "snitch": "item/Golden_Snitch.png",
    "record-paper": "item/Student_Record_Form.png",
}
CHARACTERS = {
    "abby": ("艾比·柏金斯", "Abby", "Amby"),
    "thea": ("西婭·赫姆斯", "Thea", "Thea"),
    "gaile": ("蓋勒·布拉德雷", "Caleb", "Gaile"),
    "zephyr": ("澤菲爾·哈特", "Zephyr", "Zephyr"),
}
for key, (name, short, dorm) in CHARACTERS.items():
    FILES[key] = f"people/霍_立繪_{name}_去背.png"
    FILES[f"{key}-chibi"] = f"people/霍_小Q_{short}_去背.png"
    FILES[f"{key}-cat"] = f"people/貓咪_去背_{short}.png"
    FILES[f"{key}-room"] = f"Dorm_{dorm}.png"
    FILES[f"{key}-record"] = f"item/Student_Record_Form_{dorm}.png"
    FILES[f"{key}-riding"] = f"people/騎行_去背_{short}{' ' if key == 'abby' else ''}.png"

for key, filename in FILES.items():
    # Skip unchanged artwork when preparing a later batch of supplied assets.
    if (OUT / f"{key}.webp").exists() and (OUT / f"{key}.webp").stat().st_mtime >= (ROOT / "source" / filename).stat().st_mtime:
        continue
    with Image.open(ROOT / "source" / filename) as original:
        picture = original.convert("RGBA")
        if filename.startswith("people/") or key == "snitch":
            bounds = picture.getchannel("A").getbbox()
            if bounds:
                picture = picture.crop(bounds)
            picture.thumbnail((850, 1100), Image.Resampling.LANCZOS)
        else:
            picture.thumbnail((1600, 1900), Image.Resampling.LANCZOS)
        picture.save(OUT / f"{key}.webp", "WEBP", quality=88, method=6)
print(f"Prepared {len(FILES)} assets ({sum(p.stat().st_size for p in OUT.glob('*.webp')) / 1024 / 1024:.1f} MiB).")
