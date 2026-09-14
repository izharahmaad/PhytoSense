import pytest

from app.ml.metrics import (
    classification_metrics,
    regression_metrics,
)


CLASS_NAMES = [
    "healthy",
    "mild_stress",
    "moderate_stress",
    "severe_stress",
]


def test_classification_metrics_shape():
    result = classification_metrics(
        y_true=[0, 1, 2, 3],
        y_pred=[0, 1, 1, 3],
        class_names=CLASS_NAMES,
    )

    assert len(result["confusion_matrix"]) == 4
    assert all(
        len(row) == 4
        for row in result["confusion_matrix"]
    )
    assert "macro avg" in result["classification_report"]


def test_regression_metrics():
    result = regression_metrics(
        y_true=[0.9, 0.6],
        y_pred=[0.8, 0.5],
    )

    assert result["health_mae"] == pytest.approx(0.1)