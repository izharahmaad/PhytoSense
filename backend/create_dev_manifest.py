from pathlib import Path

import pandas as pd


DATASET_ROOT = Path("data/processed/dev_dataset")
OUTPUT_PATH = Path("data/manifests/dev_manifest.csv")

CLASS_CONFIG = {
    "healthy": {
        "health_score": 0.90,
        "stress_label": "healthy",
        "cause_labels": "",
    },
    "mild_stress": {
        "health_score": 0.65,
        "stress_label": "mild_stress",
        "cause_labels": "nutrient_deficiency",
    },
    "moderate_stress": {
        "health_score": 0.45,
        "stress_label": "moderate_stress",
        "cause_labels": "water_deficit;heat_stress",
    },
    "severe_stress": {
        "health_score": 0.20,
        "stress_label": "severe_stress",
        "cause_labels": "water_deficit;fungal_infection",
    },
}

rows = []

for class_name, config in CLASS_CONFIG.items():
    class_dir = DATASET_ROOT / class_name

    for image_path in sorted(class_dir.glob("*")):
        if image_path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue

        rows.append(
            {
                "image_path": str(image_path.relative_to(DATASET_ROOT)).replace("\\", "/"),
                "temperature": 28.0,
                "humidity": 55.0,
                "light_intensity": 40000.0,
                "soil_moisture": 35.0,
                "health_score": config["health_score"],
                "stress_label": config["stress_label"],
                "cause_labels": config["cause_labels"],
            }
        )

OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

manifest = pd.DataFrame(rows)
manifest.to_csv(OUTPUT_PATH, index=False)

print(f"Created: {OUTPUT_PATH}")
print(f"Rows: {len(manifest)}")
print(manifest["stress_label"].value_counts())