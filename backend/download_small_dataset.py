from pathlib import Path

from datasets import load_dataset


OUTPUT_DIR = Path("data/processed/small_plantvillage")
PER_CLASS = 50

TARGET_CLASSES = {
    "Apple___healthy",
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
}

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

dataset = load_dataset(
    "sdmlai/plantvillage",
    split="train",
    streaming=True,
)

label_feature = dataset.features["label"]
counts = {name: 0 for name in TARGET_CLASSES}

for item in dataset:
    label_id = item["label"]

    if hasattr(label_feature, "int2str"):
        label_name = label_feature.int2str(label_id)
    else:
        label_name = str(label_id)

    if label_name not in TARGET_CLASSES:
        continue

    if counts[label_name] >= PER_CLASS:
        continue

    class_dir = OUTPUT_DIR / label_name
    class_dir.mkdir(parents=True, exist_ok=True)

    image = item["image"].convert("RGB")
    output_path = class_dir / f"{counts[label_name]:04d}.jpg"
    image.save(output_path, format="JPEG", quality=90)

    counts[label_name] += 1
    print(f"{label_name}: {counts[label_name]}/{PER_CLASS}")

    if all(count >= PER_CLASS for count in counts.values()):
        break

print("Download complete")
print(counts)