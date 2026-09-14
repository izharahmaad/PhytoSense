"""
Training script for the PhytoSense multimodal fusion model.

Development example:

python -m app.ml.train `
  --manifest data/manifests/dev_manifest.csv `
  --image-root data/processed/dev_dataset `
  --epochs 3 `
  --batch-size 4 `
  --lr 0.0001 `
  --output models/dev_phytosense_fusion.pt `
  --metrics-output runs/dev_metrics.json
"""

import argparse
import json
import random
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import f1_score, mean_absolute_error
from torch.utils.data import DataLoader, random_split
from torch.utils.tensorboard import SummaryWriter

from app.config import settings
from app.ml.dataset import (
    PhytoSenseDataset,
    get_eval_transforms,
    get_train_transforms,
)
from app.ml.fusion_model import PhytoSenseFusionModel


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)

    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def compute_loss(
    outputs,
    batch,
    health_weight: float = 1.0,
    stress_weight: float = 1.0,
    cause_weight: float = 1.0,
):
    health_pred, stress_logits, cause_logits = outputs

    mse = torch.nn.functional.mse_loss(
        health_pred,
        batch["health_score"],
    )

    ce = torch.nn.functional.cross_entropy(
        stress_logits,
        batch["stress_label"],
    )

    bce = torch.nn.functional.binary_cross_entropy_with_logits(
        cause_logits,
        batch["cause_labels"],
    )

    total = (
        health_weight * mse
        + stress_weight * ce
        + cause_weight * bce
    )

    return total, {
        "mse": float(mse.item()),
        "ce": float(ce.item()),
        "bce": float(bce.item()),
    }


def evaluate(model, loader, device):
    model.eval()

    all_stress_true = []
    all_stress_pred = []
    all_health_true = []
    all_health_pred = []

    with torch.no_grad():
        for batch in loader:
            image = batch["image"].to(device)
            env = batch["env_features"].to(device)

            health_pred, stress_logits, _ = model(image, env)

            all_stress_true.extend(
                batch["stress_label"].tolist()
            )
            all_stress_pred.extend(
                stress_logits.argmax(dim=1).cpu().tolist()
            )

            all_health_true.extend(
                batch["health_score"].tolist()
            )
            all_health_pred.extend(
                health_pred.cpu().tolist()
            )

    f1 = f1_score(
        all_stress_true,
        all_stress_pred,
        average="macro",
        zero_division=0,
    )

    mae = mean_absolute_error(
        all_health_true,
        all_health_pred,
    )

    return {
        "stress_f1_macro": float(f1),
        "health_mae": float(mae),
        "sample_count": len(all_stress_true),
    }


def build_datasets(manifest_path, image_root, val_split, seed):
    train_dataset = PhytoSenseDataset(
        manifest_csv=manifest_path,
        image_root=image_root,
        transforms=get_train_transforms(),
    )

    eval_dataset = PhytoSenseDataset(
        manifest_csv=manifest_path,
        image_root=image_root,
        transforms=get_eval_transforms(),
    )

    if len(train_dataset) < 2:
        raise ValueError("At least two samples are required.")

    val_len = max(1, int(len(train_dataset) * val_split))
    train_len = len(train_dataset) - val_len

    if train_len < 1:
        raise ValueError("Validation split leaves no training samples.")

    generator = torch.Generator().manual_seed(seed)

    train_subset, _ = random_split(
        train_dataset,
        [train_len, val_len],
        generator=generator,
    )

    _, val_subset = random_split(
        eval_dataset,
        [train_len, val_len],
        generator=generator,
    )

    return train_subset, val_subset


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--manifest",
        type=str,
        required=True,
    )

    parser.add_argument(
        "--image-root",
        type=str,
        default="",
    )

    parser.add_argument(
        "--epochs",
        type=int,
        default=20,
    )

    parser.add_argument(
        "--batch-size",
        type=int,
        default=16,
    )

    parser.add_argument(
        "--lr",
        type=float,
        default=1e-4,
    )

    parser.add_argument(
        "--val-split",
        type=float,
        default=0.2,
    )

    parser.add_argument(
        "--seed",
        type=int,
        default=42,
    )

    parser.add_argument(
        "--output",
        type=str,
        default=settings.MODEL_PATH,
    )

    parser.add_argument(
        "--metrics-output",
        type=str,
        default="runs/metrics.json",
    )

    args = parser.parse_args()

    if not 0.05 <= args.val_split <= 0.5:
        raise ValueError("--val-split must be between 0.05 and 0.5.")

    set_seed(args.seed)

    device = torch.device(
        "cuda" if torch.cuda.is_available() else "cpu"
    )

    train_subset, val_subset = build_datasets(
        manifest_path=args.manifest,
        image_root=args.image_root,
        val_split=args.val_split,
        seed=args.seed,
    )

    train_loader = DataLoader(
        train_subset,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=0,
    )

    val_loader = DataLoader(
        val_subset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=0,
    )

    model = PhytoSenseFusionModel(
        num_stress_classes=len(settings.CLASS_NAMES),
        num_cause_labels=len(settings.CAUSE_LABELS),
    ).to(device)

    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=args.lr,
        weight_decay=1e-4,
    )

    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer,
        T_max=args.epochs,
    )

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    metrics_path = Path(args.metrics_output)
    metrics_path.parent.mkdir(parents=True, exist_ok=True)

    writer = SummaryWriter(
        log_dir=str(metrics_path.parent / "tensorboard")
    )

    history = {
        "config": {
            "manifest": args.manifest,
            "image_root": args.image_root,
            "epochs": args.epochs,
            "batch_size": args.batch_size,
            "learning_rate": args.lr,
            "validation_split": args.val_split,
            "seed": args.seed,
            "device": str(device),
            "train_samples": len(train_subset),
            "validation_samples": len(val_subset),
        },
        "epochs": [],
    }

    best_f1 = -1.0

    for epoch in range(args.epochs):
        model.train()
        running_loss = 0.0

        for batch in train_loader:
            batch = {
                key: value.to(device)
                if torch.is_tensor(value)
                else value
                for key, value in batch.items()
            }

            optimizer.zero_grad()

            outputs = model(
                batch["image"],
                batch["env_features"],
            )

            loss, loss_parts = compute_loss(
                outputs,
                batch,
            )

            loss.backward()
            optimizer.step()

            running_loss += float(loss.item())

        scheduler.step()

        average_loss = running_loss / max(1, len(train_loader))
        validation_metrics = evaluate(
            model,
            val_loader,
            device,
        )

        epoch_record = {
            "epoch": epoch + 1,
            "train_loss": average_loss,
            **loss_parts,
            **validation_metrics,
            "learning_rate": scheduler.get_last_lr()[0],
        }

        history["epochs"].append(epoch_record)

        writer.add_scalar(
            "train/loss",
            average_loss,
            epoch,
        )

        writer.add_scalar(
            "validation/stress_f1_macro",
            validation_metrics["stress_f1_macro"],
            epoch,
        )

        writer.add_scalar(
            "validation/health_mae",
            validation_metrics["health_mae"],
            epoch,
        )

        print(
            f"Epoch {epoch + 1}/{args.epochs} | "
            f"loss={average_loss:.4f} | "
            f"val_f1={validation_metrics['stress_f1_macro']:.4f} | "
            f"val_mae={validation_metrics['health_mae']:.4f}"
        )

        if validation_metrics["stress_f1_macro"] > best_f1:
            best_f1 = validation_metrics["stress_f1_macro"]

            torch.save(
                model.state_dict(),
                output_path,
            )

            print(
                f"  -> saved new best checkpoint to {output_path}"
            )

        with metrics_path.open("w", encoding="utf-8") as file:
            json.dump(history, file, indent=2)

    writer.close()


if __name__ == "__main__":
    main()