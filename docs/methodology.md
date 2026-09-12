# Research Methodology (for CSC Study Plan / Thesis)

## Research Question
Can multimodal machine learning combine visual plant characteristics with
environmental conditions to identify early plant stress and estimate its
likely causes more reliably than image-only classification?

## Planned Experiments
1. **Baseline**: image-only CNN classifier for stress level (no environment).
2. **Multimodal fusion**: image + environment via concatenation (this repo's
   default architecture).
3. **Ablation**: remove each environmental feature one at a time to measure
   its marginal contribution to F1 / MAE.
4. **Fusion strategy comparison**: concatenation vs. gated fusion vs.
   cross-attention fusion.
5. **Explainability validation**: qualitative review of Grad-CAM maps against
   agronomist-labeled regions of interest, where available.

## Evaluation Metrics
- Stress classification: precision, recall, F1 (macro), confusion matrix.
- Health score regression: MAE, RMSE.
- Cause multi-label classification: per-label F1, Hamming loss.

## Datasets
- PlantVillage (public, leaf disease images) for the vision branch pretraining.
- Synthetic/logged environmental readings paired with images for the fusion
  dataset (to be collected or simulated in Phase 1).

## Limitations (to state explicitly in the proposal)
- Environmental readings are currently manually entered or simulated; a real
  IoT sensor pipeline is future work.
- Dataset does not yet cover multiple crop species; generalization across
  crops needs a broader dataset in a follow-up phase.

## Future Work
- IoT sensor integration for automatic environmental logging.
- Cross-attention multimodal fusion.
- Expansion to multiple crop species.
- On-device (edge) inference for offline use in remote areas.
