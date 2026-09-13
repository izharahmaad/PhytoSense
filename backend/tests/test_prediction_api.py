from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import json
import time


BASE_URL = (
    "https://api.github.com/repos/spMohanty/"
    "PlantVillage-Dataset/contents/raw/color"
)

OUTPUT_DIR = Path("data/processed/small_plantvillage")
PER_CLASS = 5

TARGET_CLASSES = [
    "Apple___healthy",
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_rust",
]


def get_json(url: str):
    request = Request(
        url,
        headers={
            "User-Agent": "PhytoSense-dataset-downloader",
            "Accept": "application/vnd.github+json",
        },
    )

    with urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def download_file(url: str, destination: Path, attempts: int = 5):
    for attempt in range(1, attempts + 1):
        try:
            request = Request(
                url,
                headers={
                    "User-Agent": "PhytoSense-dataset-downloader",
                },
            )

            with urlopen(request, timeout=180) as response:
                data = response.read()

            if not data:
                raise RuntimeError("Downloaded file is empty")

            destination.write_bytes(data)
            return

        except (HTTPError, URLError, TimeoutError, RuntimeError) as error:
            if attempt == attempts:
                raise

            wait_seconds = min(60, 5 * (2 ** (attempt - 1)))
            print(
                f"Download failed ({error}). "
                f"Retrying in {wait_seconds} seconds..."
            )
            time.sleep(wait_seconds)


for class_name in TARGET_CLASSES:
    print(f"Reading class: {class_name}")

    class_url = f"{BASE_URL}/{class_name}"
    files = get_json(class_url)

    image_files = [
        item
        for item in files
        if item["type"] == "file"
        and item["name"].lower().endswith((".jpg", ".jpeg", ".png"))
    ]

    selected_files = image_files[:PER_CLASS]
    class_dir = OUTPUT_DIR / class_name
    class_dir.mkdir(parents=True, exist_ok=True)

    for index, item in enumerate(selected_files):
        destination = class_dir / f"{index:04d}.jpg"

        if destination.exists() and destination.stat().st_size > 0:
            print(f"Already exists: {destination}")
            continue

        print(f"Downloading {class_name}: {index + 1}/{PER_CLASS}")
        download_file(item["download_url"], destination)
        time.sleep(3)

print("Download complete")

for class_name in TARGET_CLASSES:
    class_dir = OUTPUT_DIR / class_name
    count = len(list(class_dir.glob("*")))
    print(f"{class_name}: {count} images")