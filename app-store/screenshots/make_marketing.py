#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

CANVAS_W, CANVAS_H = 1290, 2796
BG_COLOR = (245, 240, 232)        # #F5F0E8 warm cream
HEADLINE_COLOR = (45, 27, 14)     # #2D1B0E dark brown
SUBTITLE_COLOR = (74, 124, 89)    # #4A7C59 sage green
SHADOW_COLOR = (0, 0, 0, 80)      # semi-transparent dark

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

SCREENSHOTS = [
    {
        "out": "marketing_1.png",
        "src": "real_sessions.png",
        "headline": "Every session,\nsafely remembered.",
        "subtitle": "Encrypted journal entries. Private by design.",
    },
    {
        "out": "marketing_2.png",
        "src": "real_trends.png",
        "headline": "Watch your mood\nimprove over time.",
        "subtitle": "Weekly and monthly mood trends. All private.",
    },
    {
        "out": "marketing_3.png",
        "src": "real_patterns.png",
        "headline": "Discover what\nmatters most to you.",
        "subtitle": "Tag themes and emotional patterns across months.",
    },
]

def load_font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/Library/Fonts/Arial Bold.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                # index 1 is often bold in .ttc files
                idx = 1 if bold and path.endswith(".ttc") else 0
                return ImageFont.truetype(path, size, index=idx)
            except Exception:
                try:
                    return ImageFont.truetype(path, size, index=0)
                except Exception:
                    continue
    return ImageFont.load_default()

def draw_rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill)

def make_screenshot(cfg):
    src_path = os.path.join(OUTPUT_DIR, cfg["src"])
    phone_img = Image.open(src_path).convert("RGBA")

    # --- Canvas ---
    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), BG_COLOR + (255,))
    draw = ImageDraw.Draw(canvas)

    # --- Headline ---
    headline_font = load_font(96, bold=True)
    # Measure headline bounding box
    dummy = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    bbox = dummy.multiline_textbbox((0, 0), cfg["headline"], font=headline_font, align="center")
    headline_h = bbox[3] - bbox[1]

    headline_y = 140
    headline_bottom = headline_y + headline_h + 40  # extra padding

    # Draw headline
    draw.multiline_text(
        (CANVAS_W // 2, headline_y),
        cfg["headline"],
        font=headline_font,
        fill=HEADLINE_COLOR,
        anchor="ma",
        align="center",
    )

    # --- Subtitle ---
    subtitle_font = load_font(48, bold=False)
    subtitle_y = 2600

    # Measure subtitle
    sbbox = dummy.multiline_textbbox((0, 0), cfg["subtitle"], font=subtitle_font, align="center")
    subtitle_h = sbbox[3] - sbbox[1]

    subtitle_top = subtitle_y  # top of subtitle region

    # --- Phone image scaling ---
    avail_top = headline_bottom + 20
    avail_bottom = subtitle_top - 20
    avail_h = avail_bottom - avail_top
    avail_w = 900  # max width

    ph_w, ph_h = phone_img.size
    scale = min(avail_w / ph_w, avail_h / ph_h)
    new_w = int(ph_w * scale)
    new_h = int(ph_h * scale)

    phone_resized = phone_img.resize((new_w, new_h), Image.LANCZOS)

    # Center phone horizontally and vertically in available space
    phone_x = (CANVAS_W - new_w) // 2
    phone_y = avail_top + (avail_h - new_h) // 2

    # --- Drop shadow ---
    shadow_layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)
    shadow_offset = 12
    shadow_radius = 24
    draw_rounded_rect(
        shadow_draw,
        (phone_x + shadow_offset, phone_y + shadow_offset,
         phone_x + new_w + shadow_offset, phone_y + new_h + shadow_offset),
        radius=shadow_radius,
        fill=SHADOW_COLOR,
    )
    canvas = Image.alpha_composite(canvas, shadow_layer)

    # --- Paste phone ---
    canvas.paste(phone_resized, (phone_x, phone_y), phone_resized)

    # --- Subtitle ---
    draw2 = ImageDraw.Draw(canvas)
    draw2.multiline_text(
        (CANVAS_W // 2, subtitle_y),
        cfg["subtitle"],
        font=subtitle_font,
        fill=SUBTITLE_COLOR,
        anchor="ma",
        align="center",
    )

    # Save as RGB PNG
    out_path = os.path.join(OUTPUT_DIR, cfg["out"])
    canvas.convert("RGB").save(out_path, "PNG")
    print(f"Saved: {out_path}  (phone: {new_w}x{new_h}, pos: {phone_x},{phone_y})")

for cfg in SCREENSHOTS:
    make_screenshot(cfg)

print("Done!")
