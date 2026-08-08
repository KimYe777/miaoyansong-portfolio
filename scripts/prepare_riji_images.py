from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"D:\Codex_Workspace\projects\日迹作品集")
RENDERED = SOURCE / "tmp" / "pdf-review-website"


def save_webp(source: Path, target: Path, max_width: int, quality: int = 84) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = image.convert("RGB")
        if image.width > max_width:
            height = round(image.height * max_width / image.width)
            image = image.resize((max_width, height), Image.Resampling.LANCZOS)
        image.save(target, "WEBP", quality=quality, method=6)


for index in range(1, 13):
    save_webp(
        RENDERED / f"page-{index:02d}.jpg",
        ROOT / "public" / "assets" / "portfolio-pages" / "riji" / f"page-{index:02d}.webp",
        1920,
        85,
    )

save_webp(
    SOURCE / "assets" / "product-renders" / "01-hero-three-quarter.png",
    ROOT / "public" / "assets" / "projects" / "riji" / "hero.webp",
    1600,
    86,
)
save_webp(
    SOURCE / "assets" / "product-renders" / "04-side-printing.png",
    ROOT / "public" / "assets" / "projects" / "riji" / "side-printing.webp",
    1600,
    84,
)
save_webp(
    SOURCE / "assets" / "family-rainy-day.png",
    ROOT / "public" / "interactive" / "riji-ui" / "assets" / "family-rainy-day.webp",
    900,
    84,
)
save_webp(
    SOURCE / "assets" / "product-renders" / "01-hero-three-quarter.png",
    ROOT / "public" / "interactive" / "riji-ui" / "assets" / "product-hero.webp",
    1200,
    82,
)
save_webp(
    SOURCE / "assets" / "product-renders" / "03-nfc-interaction.png",
    ROOT / "public" / "interactive" / "riji-ui" / "assets" / "product-nfc.webp",
    1200,
    82,
)
