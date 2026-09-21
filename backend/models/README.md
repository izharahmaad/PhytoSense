# Model artifacts

The application expects the health checkpoint at:

```text
models/phytosense_fusion.pt
```

Large model artifacts are intentionally excluded from Git. Keep a local copy or use the project's artifact storage process.

The health model predicts:

- healthy
- mild_stress
- moderate_stress
- severe_stress

A future plant/leaf gate should be stored separately as:

```text
models/leaf_gate.pt
```