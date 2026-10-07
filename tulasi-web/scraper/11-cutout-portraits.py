"""
Step 11: background-removed doctor portraits, fully offline (OpenCV only).

The live photos have a printed "tulasihealthcare" banner behind every doctor.
For each photo:
  1. find the face (Haar cascade that ships with OpenCV),
  2. GrabCut seeded with a head-and-shoulders box,
  3. refine: face = certain foreground, banner above the head = certain background,
  4. keep only the main silhouette, feather the edge,
  5. crop a 4:5 portrait with the face in the upper third,
and save data/portrait-sources/legacy/<slug>.webp (transparent). Step 12
(12-uniform-portraits.py) gives these the same head size and position as the new headshots
and writes the portraits the site uses (web/public/team-portraits/).
Also writes reports/cutouts-contact-sheet.jpg to review the results at a glance.

    python 11-cutout-portraits.py
"""
import json, os, sys
import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, "web")
OUT = os.path.join(ROOT, "data", "portrait-sources", "legacy")
os.makedirs(OUT, exist_ok=True)

doctors = json.load(open(os.path.join(WEB, "content", "doctors.json"), encoding="utf8"))
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
TARGET_W, TARGET_H = 480, 600  # 4:5


def cutout(img):
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(24, 24))
    if len(faces) == 0:
        return None, None
    x, y, fw, fh = max(faces, key=lambda f: f[2] * f[3])

    # 1. GrabCut from a head-and-shoulders rectangle down to the bottom edge
    x0, x1 = max(1, int(x - fw * 1.4)), min(w - 2, int(x + fw * 2.4))
    y0 = max(1, int(y - fh * 0.65))
    mask = np.zeros((h, w), np.uint8)
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(img, mask, (x0, y0, x1 - x0, h - y0 - 1), bgd, fgd, 5, cv2.GC_INIT_WITH_RECT)

    # 2. refine with hard constraints
    cx, cy = x + fw // 2, y + fh // 2
    cv2.ellipse(mask, (cx, cy + fh // 10), (int(fw * 0.42), int(fh * 0.55)), 0, 0, 360, cv2.GC_FGD, -1)  # face
    cv2.rectangle(mask, (cx - fw // 4, cy), (cx + fw // 4, min(h - 1, cy + int(fh * 1.6))), cv2.GC_FGD, -1)  # neck/chest centre
    above = max(0, int(y - fh * 0.45))
    mask[:above, :] = cv2.GC_BGD  # banner above the head
    side = int(fw * 1.9)  # far left/right of the body at head height
    mask[: y + fh, : max(0, cx - side)] = cv2.GC_BGD
    mask[: y + fh, min(w, cx + side):] = cv2.GC_BGD
    # well beyond shoulder width, top to bottom
    wide = int(fw * 2.35)
    mask[:, : max(0, cx - wide)] = cv2.GC_BGD
    mask[:, min(w, cx + wide):] = cv2.GC_BGD
    # banner purple tiles/logos beside the body (hue ~ 125-160 in OpenCV), never the central column
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    purple = (hsv[:, :, 0] >= 125) & (hsv[:, :, 0] <= 165) & (hsv[:, :, 1] > 70) & (hsv[:, :, 2] > 40)
    cols = np.abs(np.arange(w) - cx) > fw * 0.95
    purple &= cols[None, :]
    purple[: y + fh // 2, :] |= False
    mask[purple] = cv2.GC_BGD
    cv2.grabCut(img, mask, None, bgd, fgd, 4, cv2.GC_INIT_WITH_MASK)
    m = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    # 3. keep the silhouette connected to the face, fill holes, feather
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, labels, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    if n > 1:
        keep = labels[min(h - 1, cy), min(w - 1, cx)]
        if keep == 0:
            keep = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        m = np.where(labels == keep, 255, 0).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    m = cv2.GaussianBlur(m, (5, 5), 0)
    return m, (x, y, fw, fh)


def portrait(img, m, face):
    """4:5 crop, face centred horizontally, eyes around 36% from the top, upscaled smoothly."""
    h, w = img.shape[:2]
    x, y, fw, fh = face
    crop_h = min(h, int(fh * 3.6))
    crop_w = int(crop_h * TARGET_W / TARGET_H)
    cx = x + fw // 2
    left = int(np.clip(cx - crop_w // 2, 0, max(0, w - crop_w)))
    top = int(np.clip(y - fh * 0.75, 0, max(0, h - crop_h)))
    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    rgba[:, :, 3] = m
    c = rgba[top : top + crop_h, left : left + crop_w]
    # pad to exact 4:5 if the photo edge cut it short (transparent padding)
    ph, pw = c.shape[:2]
    canvas = np.zeros((int(pw * TARGET_H / TARGET_W) if ph < pw * TARGET_H / TARGET_W else ph, pw, 4), np.uint8)
    canvas[canvas.shape[0] - ph :, :] = c  # anchor to the bottom (shoulders reach the edge)
    return cv2.resize(canvas, (TARGET_W, TARGET_H), interpolation=cv2.INTER_LANCZOS4)


sheet, failed = [], []
for d in doctors:
    if not d.get("photo"):
        failed.append((d["slug"], "no photo"))
        continue
    src = os.path.join(WEB, "public", d["photo"].split("tulasihealthcare.com/")[-1])
    img = cv2.imread(src)
    if img is None:
        failed.append((d["slug"], "unreadable"))
        continue
    m, face = cutout(img)
    if m is None:
        failed.append((d["slug"], "no face found"))
        continue
    out = portrait(img, m, face)
    cv2.imwrite(os.path.join(OUT, d["slug"] + ".webp"), out, [cv2.IMWRITE_WEBP_QUALITY, 90])
    # preview on a pastel card for the contact sheet
    bg = np.full((TARGET_H, TARGET_W, 3), (238, 226, 232), np.uint8)
    a = out[:, :, 3:4] / 255.0
    sheet.append(cv2.resize((out[:, :, :3] * a + bg * (1 - a)).astype(np.uint8), (160, 200)))

if sheet:
    cols = 8
    while len(sheet) % cols:
        sheet.append(np.full((200, 160, 3), 255, np.uint8))
    rows = [np.hstack(sheet[i : i + cols]) for i in range(0, len(sheet), cols)]
    cv2.imwrite(os.path.join(ROOT, "reports", "cutouts-contact-sheet.jpg"), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 82])
print(f"cutouts: {len(doctors) - len(failed)} / {len(doctors)}")
for slug, why in failed:
    print(f"  skipped {slug}: {why}")
