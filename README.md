# PhytoSense

**Multimodal Plant Health & Stress Assessment System**
Computer Vision + Environmental Intelligence + Explainable AI

PhytoSense fuses plant-leaf imagery with environmental sensor data (temperature,
humidity, light intensity, soil moisture) to estimate plant health, classify stress
severity, infer probable stress causes, and generate explainable recommendations.

## Research Question
Can multimodal machine learning combine visual plant characteristics with
environmental conditions to identify early plant stress and estimate its likely
causes more reliably than image-only classification?

## Architecture
```
        Plant Image                Environment
             |                     (Temp, Humidity,
             v                      Light, Soil Moisture)
    +-----------------+                    |
    | CNN / ViT        |                   v
    | Feature Extractor|          +-------------------+
    +--------+---------+          | Environment MLP  |
             |                    |    Encoder        |
             v                    +---------+---------+
      Visual Embedding                      |
             |                              |
             +--------------+---------------+
                            v
                  +---------------------+
                  |  Multimodal Fusion  |
                  |  (concat + MLP head)|
                  +----------+----------+
                             |
        +--------------------+--------------------+
        v                    v                     v
  Health Score         Stress Level          Cause Analysis
  (regression)        (classification)     (multi-label)
        |
        v
  Grad-CAM + Feature Attribution (Explainability)
        |
        v
  FastAPI REST API  <-->  SQLite (history)
        |
        v
  React Native / Expo Mobile App
```

## Project Status
This repository is roughly **60% complete**: the model architecture, training
pipeline, FastAPI backend, database layer, and mobile app screens/navigation
are scaffolded and functional at a skeleton level. Remaining work is listed in
`docs/roadmap.md`.

## Repo Structure
```
phytosense/
├── backend/          FastAPI service + PyTorch models + training pipeline
├── mobile/           React Native / Expo application
├── docs/             Architecture, methodology, roadmap
└── notebooks/        Experiment notebooks (EDA, ablation studies)
```

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Mobile App
```bash
cd mobile
npm install
npx expo start
```
Update `API_BASE_URL` in `mobile/src/services/api.ts` to your machine's local
IP (not `localhost`) when testing on a physical device.

## Tech Stack
All components are free / open-source: PyTorch, torchvision, OpenCV, FastAPI,
Uvicorn, SQLAlchemy + SQLite, React Native, Expo, and public datasets
(e.g. PlantVillage).

## License
MIT — see `LICENSE`.

```
PhytoSense
├─ backend
│  ├─ app
│  │  ├─ api
│  │  │  ├─ routes.py
│  │  │  └─ __init__.py
│  │  ├─ config.py
│  │  ├─ db
│  │  │  ├─ crud.py
│  │  │  ├─ database.py
│  │  │  ├─ models.py
│  │  │  └─ __init__.py
│  │  ├─ main.py
│  │  ├─ ml
│  │  │  ├─ dataset.py
│  │  │  ├─ env_encoder.py
│  │  │  ├─ explain.py
│  │  │  ├─ fusion_model.py
│  │  │  ├─ inference.py
│  │  │  ├─ train.py
│  │  │  ├─ vision_model.py
│  │  │  └─ __init__.py
│  │  ├─ schemas
│  │  │  ├─ prediction.py
│  │  │  └─ __init__.py
│  │  └─ __init__.py
│  ├─ data
│  │  ├─ manifest_sample.csv
│  │  └─ sample_images
│  ├─ models
│  │  └─ README.md
│  ├─ requirements.txt
│  └─ tests
│     ├─ test_api.py
│     ├─ test_ml.py
│     └─ __init__.py
├─ docs
│  ├─ architecture.md
│  ├─ methodology.md
│  └─ roadmap.md
├─ LICENSE
├─ mobile
│  ├─ app.json
│  ├─ App.tsx
│  ├─ assets
│  │  └─ icon.png
│  ├─ package.json
│  ├─ src
│  │  ├─ components
│  │  │  ├─ HealthScoreCard.tsx
│  │  │  └─ StressBadge.tsx
│  │  ├─ navigation
│  │  │  └─ AppNavigator.tsx
│  │  ├─ screens
│  │  │  ├─ CaptureScreen.tsx
│  │  │  ├─ HistoryScreen.tsx
│  │  │  ├─ HomeScreen.tsx
│  │  │  └─ ResultScreen.tsx
│  │  └─ services
│  │     └─ api.ts
│  └─ tsconfig.json
├─ notebooks
│  └─ 01_eda_placeholder.ipynb
└─ README.md

```
```
PhytoSense
├─ backend
│  ├─ .pytest_cache
│  │  ├─ CACHEDIR.TAG
│  │  ├─ README.md
│  │  └─ v
│  │     └─ cache
│  │        └─ nodeids
│  ├─ app
│  │  ├─ api
│  │  │  ├─ routes.py
│  │  │  └─ __init__.py
│  │  ├─ config.py
│  │  ├─ db
│  │  │  ├─ crud.py
│  │  │  ├─ database.py
│  │  │  ├─ models.py
│  │  │  └─ __init__.py
│  │  ├─ main.py
│  │  ├─ ml
│  │  │  ├─ dataset.py
│  │  │  ├─ env_encoder.py
│  │  │  ├─ explain.py
│  │  │  ├─ fusion_model.py
│  │  │  ├─ inference.py
│  │  │  ├─ train.py
│  │  │  ├─ vision_model.py
│  │  │  └─ __init__.py
│  │  ├─ schemas
│  │  │  ├─ prediction.py
│  │  │  └─ __init__.py
│  │  └─ __init__.py
│  ├─ data
│  │  ├─ manifests
│  │  ├─ manifest_sample.csv
│  │  ├─ plantvillage
│  │  ├─ processed
│  │  │  └─ small_plantvillage
│  │  │     └─ Apple___healthy
│  │  └─ sample_images
│  │     └─ test_leaf.jpg
│  ├─ download_small_dataset.py
│  ├─ models
│  │  └─ README.md
│  ├─ phytosense.db
│  ├─ requirements.txt
│  └─ tests
│     ├─ test_api.py
│     ├─ test_ml.py
│     ├─ test_prediction_api.py
│     └─ __init__.py
├─ docs
│  ├─ architecture.md
│  ├─ methodology.md
│  └─ roadmap.md
├─ LICENSE
├─ mobile
│  ├─ app.json
│  ├─ App.tsx
│  ├─ assets
│  │  └─ icon.png
│  ├─ package.json
│  ├─ src
│  │  ├─ components
│  │  │  ├─ HealthScoreCard.tsx
│  │  │  └─ StressBadge.tsx
│  │  ├─ navigation
│  │  │  └─ AppNavigator.tsx
│  │  ├─ screens
│  │  │  ├─ CaptureScreen.tsx
│  │  │  ├─ HistoryScreen.tsx
│  │  │  ├─ HomeScreen.tsx
│  │  │  └─ ResultScreen.tsx
│  │  └─ services
│  │     └─ api.ts
│  └─ tsconfig.json
├─ notebooks
│  └─ 01_eda_placeholder.ipynb
└─ README.md

```
```
PhytoSense
├─ backend
│  ├─ app
│  │  ├─ api
│  │  │  ├─ routes.py
│  │  │  ├─ routes.py.bak
│  │  │  └─ __init__.py
│  │  ├─ config.py
│  │  ├─ db
│  │  │  ├─ crud.py
│  │  │  ├─ database.py
│  │  │  ├─ models.py
│  │  │  └─ __init__.py
│  │  ├─ main.py
│  │  ├─ ml
│  │  │  ├─ dataset.py
│  │  │  ├─ env_encoder.py
│  │  │  ├─ explain.py
│  │  │  ├─ fusion_model.py
│  │  │  ├─ inference.py
│  │  │  ├─ inference.py.bak
│  │  │  ├─ metrics.py
│  │  │  ├─ train.py
│  │  │  ├─ vision_model.py
│  │  │  └─ __init__.py
│  │  ├─ schemas
│  │  │  ├─ prediction.py
│  │  │  └─ __init__.py
│  │  └─ __init__.py
│  ├─ create_dev_manifest.py
│  ├─ data
│  │  ├─ manifests
│  │  │  └─ dev_manifest.csv
│  │  ├─ manifest_sample.csv
│  │  └─ sample_images
│  │     └─ test_leaf.jpg
│  ├─ models
│  │  └─ README.md
│  ├─ pytest.ini
│  ├─ requirements.txt
│  └─ tests
│     ├─ test_api.py
│     ├─ test_checkpoint_inference.py
│     ├─ test_metrics.py
│     ├─ test_ml.py
│     ├─ test_prediction_api.py
│     └─ __init__.py
├─ docs
│  ├─ architecture.md
│  ├─ methodology.md
│  └─ roadmap.md
├─ LICENSE
├─ mobile
│  ├─ .env
│  ├─ .expo
│  │  ├─ dev
│  │  │  └─ logs
│  │  │     └─ start.log
│  │  ├─ devices.json
│  │  ├─ README.md
│  │  └─ settings.json
│  ├─ app.json
│  ├─ App.tsx
│  ├─ assets
│  │  └─ icon.png
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ src
│  │  ├─ components
│  │  │  ├─ HealthScoreCard.tsx
│  │  │  └─ StressBadge.tsx
│  │  ├─ navigation
│  │  │  └─ AppNavigator.tsx
│  │  ├─ screens
│  │  │  ├─ CaptureScreen.tsx
│  │  │  ├─ HistoryScreen.tsx
│  │  │  ├─ HomeScreen.tsx
│  │  │  └─ ResultScreen.tsx
│  │  └─ services
│  │     └─ api.ts
│  └─ tsconfig.json
├─ notebooks
│  └─ 01_eda_placeholder.ipynb
└─ README.md

```