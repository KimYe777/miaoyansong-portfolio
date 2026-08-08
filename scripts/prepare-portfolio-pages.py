from pathlib import Path
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE = PROJECT_ROOT / "tmp" / "pdfs" / "original-pages"
OUTPUT = PROJECT_ROOT / "public" / "assets" / "portfolio-pages"

expected = {
    "clearsense": 12,
    "nightcare": 10,
    "renteye": 14,
    "wander": 15,
}

for project, expected_count in expected.items():
    sources = sorted((SOURCE / project).glob("page-*.png"))
    if len(sources) != expected_count:
        raise RuntimeError(f"{project}: expected {expected_count} pages, found {len(sources)}")

    output_dir = OUTPUT / project
    output_dir.mkdir(parents=True, exist_ok=True)

    for index, source in enumerate(sources, start=1):
        target = output_dir / f"page-{index:02d}.webp"
        with Image.open(source) as image:
            image.load()
            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGB")
            image.save(target, "WEBP", quality=88, method=6)
        print(f"{project} {index:02d}/{expected_count}: {target.name}")
