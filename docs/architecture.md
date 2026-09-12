# PhytoSense Architecture

## Overview
PhytoSense is a two-branch multimodal neural network that fuses visual and
environmental signals to produce three coordinated outputs about plant
condition.

## Branch 1: Vision
- Backbone: ResNet18 (transfer-learned from ImageNet), swappable for a ViT.
- Input: 224x224 RGB leaf image.
- Output: 256-dim embedding via `VisionFeatureExtractor`.

## Branch 2: Environment
- Input: temperature, humidity, light intensity, soil moisture (normalized 0-1).
- Encoder: 2-layer MLP with batch norm, `EnvironmentEncoder`.
- Output: 64-dim embedding.

## Fusion
- Concatenation of the 256-dim visual and 64-dim environmental embeddings (320-dim).
- Shared 128-dim MLP layer, then three heads:
  - Health score (sigmoid regression, 0-1)
  - Stress level (4-way softmax classification)
  - Cause analysis (multi-label sigmoid over 6 possible causes)

## Explainability
- Grad-CAM over the last conv block of the vision branch shows which part of
  the leaf drove the prediction.
- Gradient x input attribution over the environmental branch shows which
  sensor reading contributed most to the health score.
- Both are combined into a single natural-language recommendation string.

## Serving
- FastAPI exposes `/api/v1/predict`, `/api/v1/history`, `/api/v1/health`.
- SQLite persists every prediction for later analysis/history view.
- React Native / Expo app captures images and sensor inputs and renders results.
