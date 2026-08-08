from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public" / "assets" / "projects"
MAX_EDGE = 1800

for source in sorted(ROOT.rglob("*.png")):
    target = source.with_suffix(".webp")
    with Image.open(source) as image:
        image.load()
        if max(image.size) > MAX_EDGE:
            image.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")
        image.save(target, "WEBP", quality=84, method=6)
    print(f"{source.name} -> {target.name}")
