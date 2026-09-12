# Roadmap — Remaining ~40%

## Done (this scaffold)
- [x] Model architecture (vision branch, environment branch, fusion, 3 heads)
- [x] Dataset loader + augmentation pipeline
- [x] Training script with TensorBoard logging
- [x] Grad-CAM + gradient-based environmental attribution
- [x] FastAPI backend with /predict, /history, /health endpoints
- [x] SQLite persistence layer
- [x] React Native / Expo app: navigation, capture screen, result screen, history screen
- [x] Unit tests for model shapes and core API endpoints
- [x] Sample manifest CSV format

## Remaining Work
- [ ] Collect or source a real image + environmental-reading dataset (or
      simulate environment values on top of PlantVillage)
- [ ] Train baseline (image-only) and multimodal models; log metrics
- [ ] Run the ablation study (remove each env. feature) and record results
- [ ] Compare fusion strategies (concat vs. gated vs. cross-attention)
- [ ] Add confusion matrix + error analysis notebook
- [ ] Polish UI (loading states, error handling, dark mode, camera permissions flow)
- [ ] Add GitHub Actions CI (lint + run backend tests on push)
- [ ] Write full experiments table and results section for the paper/README
- [ ] Optional: convert trained model to ONNX/TFLite for on-device inference
- [ ] Deploy backend (Render/Railway free tier) for a live demo link
