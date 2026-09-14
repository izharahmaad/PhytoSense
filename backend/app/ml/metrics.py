from pathlib import Path
from typing import Iterable

import json
import numpy as np
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    mean_absolute_error,
)


def classification_metrics(
    y_true: Iterable[int],
    y_pred: Iterable[int],
    class_names: list[str],
) -> dict:
    y_true = list(y_true)
    y_pred = list(y_pred)

    report = classification_report(
        y_true,
        y_pred,
        labels=list(range(len(class_names))),
        target_names=class_names,
        output_dict=True,
        zero_division=0,
    )

    matrix = confusion_matrix(
        y_true,
        y_pred,
        labels=list(range(len(class_names))),
    )

    return {
        "classification_report": report,
        "confusion_matrix": matrix.tolist(),
    }


def regression_metrics(
    y_true: Iterable[float],
    y_pred: Iterable[float],
) -> dict:
    y_true = list(y_true)
    y_pred = list(y_pred)

    return {
        "health_mae": float(
            mean_absolute_error(y_true, y_pred)
        ),
    }


def save_metrics(metrics: dict, output_path: str | Path) -> None:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", encoding="utf-8") as file:
        json.dump(metrics, file, indent=2)


def save_confusion_matrix_csv(
    matrix: list[list[int]],
    class_names: list[str],
    output_path: str | Path,
) -> None:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    header = ",".join(["actual\\predicted", *class_names])
    rows = [header]

    for class_name, row in zip(class_names, matrix):
        rows.append(",".join([class_name, *map(str, row)]))

    output_path.write_text(
        "\n".join(rows) + "\n",
        encoding="utf-8",
    )