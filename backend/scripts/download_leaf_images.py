from pathlib import Path
import shutil

import kagglehub


backend = Path(__file__).resolve().parents[1]
source_dir = Path(
    kagglehub.dataset_download(
        "emmarex/plantdisease"
    )
)

destination = (
    backend
    / "data"
    / "leaf_gate"
    / "plant_leaf"
)

destination.mkdir(
    parents=True,
    exist_ok=True,
)

image_extensions = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}

images = [
    path
    for path in source_dir.rglob("*")
    if path.is_file()
    and path.suffix.lower() in image_extensions
]

for index, image in enumerate(images[:500], start=1):
    output = destination / (
        f"leaf_{index:04d}{image.suffix.lower()}"
    )
    shutil.copy2(image, output)

print(f"Downloaded source: {source_dir}")
print(f"Leaf images copied: {min(len(images), 500)}")
print(f"Destination: {destination}")