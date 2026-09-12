"""
Training script for the PhytoSense multimodal fusion model.

Usage:
    python -m app.ml.train --manifest data/manifest.csv --epochs 20 --batch-size 16

Loss = MSE(health_score) + CrossEntropy(stress_level) + BCE(cause_labels)
Logs per-epoch loss and validation metrics (F1, MAE) to stdout / TensorBoard.
"""
import argparse
import torch
from torch.utils.data import DataLoader, random_split
from torch.utils.tensorboard import SummaryWriter
from sklearn.metrics import f1_score, mean_absolute_error

from app.ml.dataset import PhytoSenseDataset, get_train_transforms, get_eval_transforms
from app.ml.fusion_model import PhytoSenseFusionModel
from app.config import settings


def compute_loss(outputs, batch, health_weight=1.0, stress_weight=1.0, cause_weight=1.0):
    health_pred, stress_logits, cause_logits = outputs
    mse = torch.nn.functional.mse_loss(health_pred, batch["health_score"])
    ce = torch.nn.functional.cross_entropy(stress_logits, batch["stress_label"])
    bce = torch.nn.functional.binary_cross_entropy_with_logits(cause_logits, batch["cause_labels"])
    total = health_weight * mse + stress_weight * ce + cause_weight * bce
    return total, {"mse": mse.item(), "ce": ce.item(), "bce": bce.item()}


def evaluate(model, loader, device):
    model.eval()
    all_stress_true, all_stress_pred = [], []
    all_health_true, all_health_pred = [], []
    with torch.no_grad():
        for batch in loader:
            image = batch["image"].to(device)
            env = batch["env_features"].to(device)
            health_pred, stress_logits, _ = model(image, env)
            all_stress_true.extend(batch["stress_label"].tolist())
            all_stress_pred.extend(stress_logits.argmax(dim=1).cpu().tolist())
            all_health_true.extend(batch["health_score"].tolist())
            all_health_pred.extend(health_pred.cpu().tolist())
    f1 = f1_score(all_stress_true, all_stress_pred, average="macro", zero_division=0)
    mae = mean_absolute_error(all_health_true, all_health_pred)
    return {"stress_f1_macro": f1, "health_mae": mae}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=str, required=True)
    parser.add_argument("--image-root", type=str, default="")
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--val-split", type=float, default=0.2)
    parser.add_argument("--output", type=str, default=settings.MODEL_PATH)
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    full_dataset = PhytoSenseDataset(args.manifest, args.image_root, transforms=get_train_transforms())
    val_len = int(len(full_dataset) * args.val_split)
    train_len = len(full_dataset) - val_len
    train_ds, val_ds = random_split(full_dataset, [train_len, val_len])
    val_ds.dataset.transforms = get_eval_transforms()

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=2)

    model = PhytoSenseFusionModel(
        num_stress_classes=len(settings.CLASS_NAMES),
        num_cause_labels=len(settings.CAUSE_LABELS),
    ).to(device)

    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)
    writer = SummaryWriter(log_dir="runs/phytosense")

    best_f1 = 0.0
    for epoch in range(args.epochs):
        model.train()
        running_loss = 0.0
        for batch in train_loader:
            image = batch["image"].to(device)
            env = batch["env_features"].to(device)
            batch = {k: (v.to(device) if torch.is_tensor(v) else v) for k, v in batch.items()}

            optimizer.zero_grad()
            outputs = model(image, env)
            loss, parts = compute_loss(outputs, batch)
            loss.backward()
            optimizer.step()
            running_loss += loss.item()

        scheduler.step()
        avg_loss = running_loss / len(train_loader)
        metrics = evaluate(model, val_loader, device)
        writer.add_scalar("train/loss", avg_loss, epoch)
        writer.add_scalar("val/stress_f1_macro", metrics["stress_f1_macro"], epoch)
        writer.add_scalar("val/health_mae", metrics["health_mae"], epoch)

        print(f"Epoch {epoch+1}/{args.epochs} | loss={avg_loss:.4f} | "
              f"val_f1={metrics['stress_f1_macro']:.4f} | val_mae={metrics['health_mae']:.4f}")

        if metrics["stress_f1_macro"] > best_f1:
            best_f1 = metrics["stress_f1_macro"]
            torch.save(model.state_dict(), args.output)
            print(f"  -> saved new best checkpoint to {args.output}")

    writer.close()


if __name__ == "__main__":
    main()
