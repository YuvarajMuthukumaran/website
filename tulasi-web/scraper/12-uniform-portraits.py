"""
Step 12: one consistent portrait style for the whole team (fully offline, OpenCV only).

The headshots we were given have different backgrounds (black studio, grey, white).
That makes a team grid look uneven. This script cuts every person out of their
background and saves a transparent 4:5 portrait to web/public/team-portraits/<slug>.webp,
so the site can place everyone on the same soft background (components/team.tsx).

  1. background colour from the photo's border, flood-filled in from the edges (certain background),
  2. face found with OpenCV's Haar cascade (certain foreground around it),
  3. GrabCut finishes the rest, then the edge is cleaned and feathered,
  4. 4:5 crop with the face in the upper third, shoulders anchored to the bottom.

Sources are the original headshot files (extracted_photos/, extracted_doctors/), never
the previously processed output, so the script is safe to run again.
Writes reports/portraits-contact-sheet.jpg to review the results.

    python 12-uniform-portraits.py [slug ...]
"""
import os, sys
import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "web", "public", "team-portraits")
PSY = os.path.join(ROOT, "extracted_photos", "Psychologist Headshots")
LEGACY = os.path.join(ROOT, "data", "portrait-sources", "legacy")  # earlier cut-outs of the small website photos (no new headshot yet)
DOC = os.path.join(ROOT, "extracted_doctors", "Doctors Headshots")
SUP2 = os.path.join(ROOT, "extracted_photos", "Supplied 2")  # second batch of headshots (named by slug)

# slug -> original file ("Punya", "Dr Anubhav" and "Dr Naseem" have no profile on the site yet)
SOURCES = {
    "ms-aastha-dwivedi": f"{PSY}/Aastha.jpg",
    "ms-ankita-bhatnagar": f"{PSY}/Ankita.jpg",
    "ms-barkha-soni": f"{PSY}/Barkha.jpg",
    "ms-chaya-chaudhary": f"{PSY}/Chaya.jpg",
    "ms-jyoti": f"{PSY}/Jyoti.jpg",
    "ms-kiran-singh": f"{PSY}/Kiran.jpg",
    "ms-manju-kumari": f"{PSY}/Manju.jpg",
    "mr-suparas-jain": f"{PSY}/Suparash.jpg",
    "surabhi-sengar": f"{PSY}/Surabi.jpg",
    "dr-alisha-nagar": f"{DOC}/Dr Alisha.png",
    "dr-gorav-gupta": f"{SUP2}/dr-gorav-gupta.webp",
    "dr-ichpreet-singh": f"{DOC}/dr ichpreet singh.png",
    "dr-kritika-soni": f"{SUP2}/dr-kritika-soni.webp",
    "ms-angshruta-mahanta": f"{SUP2}/ms-angshruta-mahanta.webp",
    "inderjeet-singh": f"{SUP2}/inderjeet-singh.webp",
    "dr-anu-yadav": f"{SUP2}/dr-anu-yadav.webp",
    "ms-ira-gupta": f"{SUP2}/ms-ira-gupta.png",
    "ms-deliaka-ghanghass": f"{SUP2}/ms-deliaka-ghanghass.png",
    "dr-madhura-samudra": f"{DOC}/dr madhrua THC.png",
    "dr-pooja-sharma": f"{DOC}/Dr Pooja THC.png",
    "dr-poorva-gupta": f"{DOC}/Dr Poorva Gupta.png",
    "dr-ratnarakshit-ingole": f"{DOC}/Dr Ratnarakshit.png",
    "dr-sameer-guliani": f"{DOC}/Dr Sammer Guliani.jpeg",
    "dr-suravi-das": f"{DOC}/Dr Suravi.png",
}

# Fifth batch: cards cropped from screenshots (pastel backdrop already, rounded corners and name label trimmed)
CARDS5 = ['dr-ratnarakshit-ingole', 'ms-titiksha-agnihotri', 'dr-ram-chander-jiloha', 'dr-pavan-kumar-pardal', 'ms-husna-zahid-hussain']
for _s in CARDS5:
    SOURCES[_s] = f"{SUP2}/{_s}.png"

# Sixth batch: three cards from one screenshot
CARDS6 = ['ms-apoorva-khanna', 'ms-ekta-kashyap', 'dr-ichpreet-singh']
for _s in CARDS6:
    SOURCES[_s] = f"{SUP2}/{_s}.png"

# Seventh batch: a clean headshot on a pastel backdrop
CARDS7 = ["ms-hardika"]
for _s in CARDS7:
    SOURCES[_s] = f"{SUP2}/{_s}.webp"

TW, TH = 640, 800  # 4:5
cascades = [
    cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml"),
    cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml"),
]


def find_face(img):
    g = cv2.equalizeHist(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
    for c in cascades:
        for n in (6, 4, 3):
            f = c.detectMultiScale(g, 1.08, n, minSize=(img.shape[1] // 10, img.shape[0] // 14))
            if len(f):
                return max(f, key=lambda r: r[2] * r[3])
    return None


# Dark studio backdrops leave slivers of black beside the head and neck. For these
# portraits, near-black pixels further than k x face-width from the face centre are
# removed (hair of the people concerned stays well inside that distance).
CLEAN = {"dr-gorav-gupta": (0.62, 40, 1.0)}
# Turban + black beard + black shirt on a dark backdrop: the face detector is off-centre here, so the
# face box is given by hand (full-resolution x, y, w, h) and near-black pixels are kept only where they
# are beard or shirt. Everything else that dark above the shoulders is backdrop.
FACE_BOX = {"dr-ram-chander-jiloha": (340, 320, 350, 380), "ms-ira-gupta": (158, 150, 136, 150)}
KEEP_DARK = {}


def matte(img, slug=None):
    """Returns (alpha uint8, face rect) for a BGR image whose background is roughly uniform."""
    H0, W0 = img.shape[:2]
    scale = 900.0 / max(H0, W0)
    sm = cv2.resize(img, (int(W0 * scale), int(H0 * scale)), interpolation=cv2.INTER_AREA) if scale < 1 else img.copy()
    scale = sm.shape[1] / W0
    h, w = sm.shape[:2]
    face = find_face(sm)
    if slug in FACE_BOX:
        face = [int(v * scale) for v in FACE_BOX[slug]]
    if face is None:
        return None, None
    x, y, fw, fh = [int(v) for v in face]
    cx = x + fw // 2

    lab = cv2.cvtColor(cv2.GaussianBlur(sm, (5, 5), 0), cv2.COLOR_BGR2LAB).astype(np.float32)
    # background model: a smooth surface (quadratic in x, y) fitted to the photo's edges, so
    # vignettes and gradients are part of the backdrop instead of looking like a person
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    xn, yn = xx / w, yy / h
    basis = np.stack([np.ones_like(xn), xn, yn, xn * xn, xn * yn, yn * yn], axis=-1)
    band = np.zeros((h, w), bool)
    band[: max(4, h // 18), :] = True
    rows = 0.82 if slug in SUPPLIED else 0.55  # these backdrops fade towards the bottom, so sample further down the sides
    band[: int(h * rows), : max(4, w // 22)] = True
    band[: int(h * rows), -max(4, w // 22):] = True
    A = basis[band]
    B = lab[band]
    keep = np.ones(len(A), bool)
    coef = None
    for _ in range(3):
        coef, *_r = np.linalg.lstsq(A[keep], B[keep], rcond=None)
        res = np.sqrt(((A @ coef - B) ** 2).sum(axis=1))
        keep = res < max(6.0, 2.5 * float(np.median(res[keep])) + 2.0)
    fit = basis @ coef
    dist = np.sqrt(((lab - fit) ** 2).sum(axis=2))
    dark_bg = float(np.median(B[:, 0])) < 60

    # 1. seeds from colour: far from the background = person, close = background
    fg_t, bg_t = (16, 7) if dark_bg else (20, 9)
    bx0, bx1 = max(0, int(cx - fw * 2.4)), min(w, int(cx + fw * 2.4))
    by0 = max(0, int(y - fh * 1.15))  # hair and turbans rise well above the Haar face box
    zone = np.zeros((h, w), np.uint8)
    zone[by0:, bx0:bx1] = 1
    sure_fg = ((dist > fg_t) & (zone == 1)).astype(np.uint8)
    sure_fg = cv2.erode(sure_fg, np.ones((3, 3), np.uint8))
    sure_bg = (dist < bg_t).astype(np.uint8)
    # smooth, edge-free regions that reach the border above the shoulders are backdrop (vignettes, two-tone panels)
    gray = cv2.GaussianBlur(cv2.cvtColor(sm, cv2.COLOR_BGR2GRAY), (0, 0), 2).astype(np.float32)
    gm = np.hypot(cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)) / 8.0
    cand = ((gm < 2.2) & (dist < (10 if dark_bg else 24))).astype(np.uint8)
    n_c, lab_c = cv2.connectedComponents(cand, connectivity=4)
    touch = set(np.unique(lab_c[0, :])) | set(np.unique(lab_c[: int(y + fh * 1.2), 0])) | set(np.unique(lab_c[: int(y + fh * 1.2), -1]))
    touch.discard(0)
    for t in touch:
        sure_bg[lab_c == t] = 1
    sure_bg = cv2.erode(sure_bg, np.ones((3, 3), np.uint8))
    sure_fg[sure_bg == 1] = 0

    mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    mask[(zone == 1) & (dist > (10 if dark_bg else 14))] = cv2.GC_PR_FGD
    mask[sure_fg == 1] = cv2.GC_PR_FGD
    mask[:by0, :] = cv2.GC_BGD
    mask[:, :bx0] = cv2.GC_BGD
    mask[:, bx1:] = cv2.GC_BGD
    mask[sure_bg == 1] = cv2.GC_PR_BGD
    # hard background only where the colour is really the backdrop's and it touches the frame above the shoulders
    hard = (dist < bg_t * 0.8).astype(np.uint8)
    nh, lh = cv2.connectedComponents(hard, connectivity=4)
    ht = set(np.unique(lh[0, :])) | set(np.unique(lh[: int(y + fh * 1.2), 0])) | set(np.unique(lh[: int(y + fh * 1.2), -1]))
    ht.discard(0)
    for t in ht:
        mask[cv2.erode((lh == t).astype(np.uint8), np.ones((3, 3), np.uint8)) == 1] = cv2.GC_BGD
    # head: face = certain person; a looser ellipse over hair = probable person
    hx, hy = (0.5, 0.78) if dark_bg else (0.7, 0.95)
    cv2.ellipse(mask, (cx, y + int(fh * (0.05 if dark_bg else 0.1))), (int(fw * hx), int(fh * hy)), 0, 0, 360, cv2.GC_PR_FGD, -1)
    cv2.ellipse(mask, (cx, y + fh // 2), (int(fw * 0.42), int(fh * 0.58)), 0, 0, 360, cv2.GC_FGD, -1)
    cv2.rectangle(mask, (cx - fw // 3, y + fh // 2), (cx + fw // 3, min(h - 1, y + int(fh * 2.2))), cv2.GC_FGD, -1)  # neck and chest
    if slug in SUPPLIED:  # backdrops that darken towards the bottom: the whole lower torso is certainly the person
        cv2.rectangle(mask, (cx - int(fw * 0.9), y + int(fh * 1.75)), (cx + int(fw * 0.9), h - 1), cv2.GC_FGD, -1)
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(sm, mask, None, bgd, fgd, 7, cv2.GC_INIT_WITH_MASK)
    m = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    # 2. keep the person, fill holes, remove specks
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, labels, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    if n > 1:
        keep = labels[min(h - 1, y + fh), min(w - 1, cx)]
        if keep == 0:
            keep = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        m = np.where(labels == keep, 255, 0).astype(np.uint8)
    # fill holes (white shirts against a white backdrop). The photo's bottom edge counts as "person" between the outermost columns
    cols = np.where(m[-6:, :].max(axis=0) > 0)[0]
    padded = cv2.copyMakeBorder(m, 0, 4, 0, 0, cv2.BORDER_CONSTANT, value=0)
    if len(cols):
        padded[h:, cols.min() : cols.max() + 1] = 255
    inv = cv2.bitwise_not(padded)
    n2, l2, s2, _ = cv2.connectedComponentsWithStats(inv, 4)
    for i in range(1, n2):
        if s2[i, cv2.CC_STAT_AREA] < h * w * 0.12 and s2[i, cv2.CC_STAT_TOP] > 0:
            padded[l2 == i] = 255
    m = padded[:h, :]
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    m = cv2.erode(m, np.ones((3, 3), np.uint8))  # drop the 1px background fringe
    if dark_bg:
        Lc = lab[:, :, 0]
        xs = np.abs(np.arange(w) - cx)[None, :].astype(np.float32)
        ys = np.arange(h)[:, None].astype(np.float32)
        # beyond the shoulders, low in the frame: only backdrop can be this dark
        m[(Lc < 28) & (xs > fw * 1.9) & (ys > y + fh * 1.6)] = 0
        if slug in CLEAN:
            k, lmax, ymax = CLEAN[slug]
            m[(Lc < lmax) & (xs > fw * k) & (ys < y + fh * ymax) & (ys > y - fh * 1.3)] = 0
        if slug in KEEP_DARK:
            cfg = KEEP_DARK[slug]
            ex, ey, rx, ry = [int(v * scale) for v in cfg["ellipse"]]
            keep = np.zeros((h, w), np.uint8)
            cv2.ellipse(keep, (ex, ey), (rx, ry), 0, 0, 360, 1, -1)
            x0, y0, x1, y1 = [int(v * scale) for v in cfg["rect"]]
            keep[y0:y1, x0:x1] = 1
            m[(Lc < 44) & (keep == 0) & (ys < cfg["ymax"] * scale)] = 0
            m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
            nn, ll, ss, _ = cv2.connectedComponentsWithStats(m, 8)
            if nn > 1:
                m = np.where(ll == (1 + int(np.argmax(ss[1:, cv2.CC_STAT_AREA]))), 255, 0).astype(np.uint8)
            inv2 = cv2.bitwise_not(m)
            n3, l3, s3, _ = cv2.connectedComponentsWithStats(inv2, 4)
            for i in range(1, n3):
                if s3[i, cv2.CC_STAT_AREA] < h * w * 0.03 and s3[i, cv2.CC_STAT_TOP] > 0:
                    m[l3 == i] = 255
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    if dark_bg:
        m = cv2.erode(m, np.ones((3, 3), np.uint8))  # drop the dark rim the black backdrop leaves round the hair
    # 3. snap the edge to the photo (hair strands), then soften
    guide = cv2.cvtColor(sm, cv2.COLOR_BGR2GRAY)
    try:
        snapped = cv2.ximgproc.guidedFilter(guide, m.astype(np.float32) / 255.0, 5, 2e-3)
        m = np.clip(snapped * 255.0, 0, 255).astype(np.uint8)
    except Exception:
        m = cv2.GaussianBlur(m, (0, 0), 1.2)
    mf = np.clip((m.astype(np.float32) - 70) * (255.0 / 130.0), 0, 255).astype(np.uint8)
    alpha = cv2.resize(mf, (W0, H0), interpolation=cv2.INTER_CUBIC) if scale < 1 else mf
    fr = (int(x / scale), int(y / scale), int(fw / scale), int(fh / scale))
    return alpha, fr


FACE_TOP, FACE_H = 0.215, 0.225  # where the face sits in the portrait, as fractions of its height


FACE_TOP_FOR = {"ms-ira-gupta": 0.27}  # tall turban: more headroom
# These photos have the person small in the frame, so their heads came out smaller than everyone else's.
FACE_H_FOR = {"ms-ira-gupta": 0.2, "dr-gorav-gupta": 0.275, "dr-sameer-guliani": 0.262, "dr-ratnarakshit-ingole": 0.26}


def portrait(img, alpha, face, slug=None):
    """4:5 portrait: same head size for everyone, face in the upper third, shoulders reach the bottom edge."""
    h, w = img.shape[:2]
    x, y, fw, fh = face
    ft = FACE_TOP_FOR.get(slug, FACE_TOP)
    s = TH * FACE_H_FOR.get(slug, FACE_H) / fh         # output px per source px
    s_need = TH * (1 - ft) / max(1, h - y)             # scale at which the photo's rows would just reach the bottom
    if s_need > s:
        s = max(s, s_need * 0.93)                      # zoom in when the photo is short; the small rest fades out below
    need_rows = TH * (1 - ft) / s
    deficit = int(np.ceil(need_rows - (h - y))) + 2
    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    rgba[:, :, 3] = alpha
    pad_out = 0
    if deficit > 0:                                    # a few rows short: pad transparently, then fade the bottom out softly
        rgba = cv2.copyMakeBorder(rgba, 0, deficit, 0, 0, cv2.BORDER_CONSTANT, value=(0, 0, 0, 0))
        h += deficit
        pad_out = deficit * s
    crop_w, crop_h = TW / s, TH / s
    cx = x + fw / 2
    left = int(round(cx - crop_w / 2))
    top = int(round(y - TH * ft / s))
    cw, ch = int(round(crop_w)), int(round(crop_h))
    canvas = np.zeros((ch, cw, 4), np.uint8)
    sx0, sy0 = max(0, left), max(0, top)
    sx1, sy1 = min(w, left + cw), min(h, top + ch)
    dx, dy = sx0 - left, sy0 - top
    canvas[dy : dy + (sy1 - sy0), dx : dx + (sx1 - sx0)] = rgba[sy0:sy1, sx0:sx1]
    out = cv2.resize(canvas, (TW, TH), interpolation=cv2.INTER_AREA if ch > TH else cv2.INTER_CUBIC)
    if pad_out > 0:
        fade = int(min(TH * 0.3, pad_out + TH * 0.05))
        ramp = np.linspace(1.0, 0.0, fade, dtype=np.float32)[:, None]
        out[TH - fade :, :, 3] = (out[TH - fade :, :, 3] * ramp).astype(np.uint8)
    return out


SUPPLIED = set(CARDS5) | set(CARDS6) | set(CARDS7) | {"dr-kritika-soni", "ms-angshruta-mahanta", "inderjeet-singh", "dr-anu-yadav", "ms-ira-gupta", "ms-deliaka-ghanghass"}
PREPARED = set(CARDS5) | set(CARDS6) | set(CARDS7) | {"ms-ira-gupta", "ms-deliaka-ghanghass"}  # already cropped out of a screenshot of two cards: no corner trim or sparkle


def clean_supplied(img, slug):
    """The second batch are screenshots: sometimes rounded white corners, a baked-in name label (Dr Kritika Soni)
    and a small faint sparkle watermark near the bottom right. Paint the sparkle out, trim corners and label."""
    if slug in PREPARED:
        return img
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    local = cv2.GaussianBlur(gray, (0, 0), 9)
    mask = np.zeros((h, w), np.uint8)
    y0, y1, x0, x1 = int(h * 0.865), int(h * 0.945), int(w * 0.80), int(w * 0.92)
    box = (gray - local)[y0:y1, x0:x1]
    mask[y0:y1, x0:x1] = (box > 6).astype(np.uint8) * 255
    mask = cv2.dilate(mask, np.ones((11, 11), np.uint8))
    if mask.any():
        img = cv2.inpaint(img, mask, 6, cv2.INPAINT_TELEA)
    m = 0.045 if slug in ("inderjeet-singh", "dr-anu-yadav") else 0.0
    if m:
        mx, my = int(w * m), int(h * m)
        img = img[my : h - my, mx : w - mx].copy()
    if slug == "dr-kritika-soni":
        img = img[: int(img.shape[0] * 0.82)]
    return img


def read(path):
    data = np.fromfile(path, np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_UNCHANGED)
    if img is None:
        return None
    if img.ndim == 3 and img.shape[2] == 4:  # flatten any alpha onto white
        a = img[:, :, 3:4] / 255.0
        img = (img[:, :, :3] * a + 255 * (1 - a)).astype(np.uint8)
    if os.path.dirname(path) == SUP2:
        img = clean_supplied(img, os.path.splitext(os.path.basename(path))[0])
    return img


def legacy(slug):
    """Earlier transparent cut-out of a small website photo: remove banner-purple leftovers, then
    give it the same head size and position as everyone else. Returns the 4:5 RGBA portrait."""
    rgba = cv2.imdecode(np.fromfile(os.path.join(LEGACY, slug + ".webp"), np.uint8), cv2.IMREAD_UNCHANGED)
    bgr, alpha = rgba[:, :, :3].copy(), rgba[:, :, 3].copy()
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    # banner purple is bright and saturated; dark hair is not. Only touch it near the silhouette's edge.
    purple = (hsv[:, :, 0] >= 130) & (hsv[:, :, 0] <= 168) & (hsv[:, :, 1] > 50) & (hsv[:, :, 2] > 80)
    inside = (alpha > 128).astype(np.uint8)
    dt = cv2.distanceTransform(inside, cv2.DIST_L2, 3)
    deep_purple = (hsv[:, :, 0] >= 125) & (hsv[:, :, 0] <= 170) & (hsv[:, :, 1] > 95) & (hsv[:, :, 2] > 35)
    kill = (purple & (dt < 16)) | (deep_purple & (dt < 24))
    alpha[cv2.dilate(kill.astype(np.uint8), np.ones((3, 3), np.uint8)) == 1] = 0
    m = (alpha > 128).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    if n > 1:
        m = np.where(lab == 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])), 255, 0).astype(np.uint8)
    inv = cv2.bitwise_not(m)  # close pin-holes left in hair and clothes
    nn, ll, ss, _ = cv2.connectedComponentsWithStats(inv, 4)
    for i in range(1, nn):
        if ss[i, cv2.CC_STAT_AREA] < 400 and ss[i, cv2.CC_STAT_TOP] > 0:
            m[ll == i] = 255
    # specks of the old banner stick to the top of the hair: open the head region with a round kernel, which
    # removes thin protrusions but keeps the smooth mass of the hair
    top_rows = int(m.shape[0] * 0.42)
    head = cv2.morphologyEx(m[:top_rows], cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    m[:top_rows] = head
    nn, ll, ss, _ = cv2.connectedComponentsWithStats(m, 8)
    if nn > 1:
        m = np.where(ll == 1 + int(np.argmax(ss[1:, cv2.CC_STAT_AREA])), 255, 0).astype(np.uint8)
    m = cv2.erode(m, np.ones((3, 3), np.uint8))
    alpha = cv2.GaussianBlur(m, (0, 0), 1.6)
    alpha = np.clip((alpha.astype(np.float32) - 60) * (255.0 / 150.0), 0, 255).astype(np.uint8)
    white = (bgr * (alpha[:, :, None] / 255.0) + 255 * (1 - alpha[:, :, None] / 255.0)).astype(np.uint8)
    H, W = white.shape[:2]
    face = find_face(white)
    ok = face is not None and 0.2 * H <= face[3] <= 0.4 * H and 100 <= face[1] <= 300
    if not ok:  # the earlier crops always put the face about here
        face = (W // 2 - 82, 135, 164, 164)
    return portrait(bgr, alpha, [int(v) for v in face], slug)


if __name__ == "__main__":
    only = set(sys.argv[1:])
    sheet, failed = [], []
    bgcol = np.full((TH, TW, 3), (244, 226, 219), np.uint8)  # soft lavender-blue (BGR) for the contact sheet
    for slug, src in SOURCES.items():
        if only and slug not in only:
            continue
        img = read(src)
        if img is None:
            failed.append((slug, "unreadable"))
            continue
        alpha, face = matte(img, slug)
        if alpha is None:
            failed.append((slug, "no face found"))
            continue
        out = portrait(img, alpha, face, slug)
        cv2.imwrite(os.path.join(OUT, slug + ".webp"), out, [cv2.IMWRITE_WEBP_QUALITY, 92])
        a = out[:, :, 3:4] / 255.0
        sheet.append(cv2.putText(cv2.resize((out[:, :, :3] * a + bgcol * (1 - a)).astype(np.uint8), (220, 275)), slug[:24], (4, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 1))
        print("ok", slug)
    for fn in sorted(os.listdir(LEGACY)):
        slug = fn[:-5]
        if slug in SOURCES or (only and slug not in only):
            continue  # people with a proper headshot never use the legacy cut-out
        out = legacy(slug)
        cv2.imwrite(os.path.join(OUT, slug + ".webp"), out, [cv2.IMWRITE_WEBP_QUALITY, 92])
        a = out[:, :, 3:4] / 255.0
        sheet.append(cv2.putText(cv2.resize((out[:, :, :3] * a + bgcol * (1 - a)).astype(np.uint8), (220, 275)), slug[:24], (4, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 1))
        print("ok (legacy)", slug)
    if sheet:
        cols = 7
        while len(sheet) % cols:
            sheet.append(np.full((275, 220, 3), 255, np.uint8))
        rows = [np.hstack(sheet[i : i + cols]) for i in range(0, len(sheet), cols)]
        cv2.imwrite(os.path.join(ROOT, "reports", "portraits-contact-sheet.jpg"), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])
    for slug, why in failed:
        print("skipped", slug, why)
