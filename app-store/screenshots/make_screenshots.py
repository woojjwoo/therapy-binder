#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os

BASE = os.path.expanduser("~/Projects/therapy-binder/app-store/screenshots")

BG_COLOR = "#F5F0E8"
TEXT_COLOR = "#2D1B0E"
SUBTITLE_COLOR = "#4A7C59"
CANVAS_W, CANVAS_H = 1290, 2796

# Try to find a good bold font
def get_font(size, bold=True):
    candidates = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/System/Library/Fonts/SF Pro Display/SF-Pro-Display-Bold.otf",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Arial.ttf",
        "/Library/Fonts/Arial Bold.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()

def rounded_corner_mask(size, radius):
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (size[0]-1, size[1]-1)], radius=radius, fill=255)
    return mask

def add_drop_shadow(canvas, img_w, img_h, paste_x, paste_y, offset=(8, 8), blur=20, opacity=77):
    shadow_layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)
    sx = paste_x + offset[0]
    sy = paste_y + offset[1]
    shadow_draw.rounded_rectangle(
        [(sx, sy), (sx + img_w, sy + img_h)],
        radius=44,
        fill=(0, 0, 0, opacity)
    )
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(blur))
    canvas.paste(shadow_layer, (0, 0), shadow_layer)

def draw_centered_text(draw, text, y_center, font, color, canvas_w=CANVAS_W):
    lines = text.split("\n")
    line_heights = []
    line_widths = []
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        line_widths.append(bbox[2] - bbox[0])
        line_heights.append(bbox[3] - bbox[1])
    
    line_spacing = 20
    total_h = sum(line_heights) + line_spacing * (len(lines) - 1)
    y = y_center - total_h // 2
    
    for i, line in enumerate(lines):
        x = (canvas_w - line_widths[i]) // 2
        draw.text((x, y), line, font=font, fill=color)
        y += line_heights[i] + line_spacing

def make_screenshot(raw_path, output_path, headline, subtitle, headline_y_center=210, subtitle_y=2600):
    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), BG_COLOR)
    
    # Load raw screenshot
    raw = Image.open(raw_path).convert("RGBA")
    
    # Scale to ~500px wide... but let's make it bigger: about 900px wide to fill better
    target_w = 900
    ratio = target_w / raw.width
    target_h = int(raw.height * ratio)
    
    # If too tall, constrain height
    max_h = 1900
    if target_h > max_h:
        ratio = max_h / raw.height
        target_w = int(raw.width * ratio)
        target_h = max_h
    
    raw_resized = raw.resize((target_w, target_h), Image.LANCZOS)
    
    paste_x = (CANVAS_W - target_w) // 2
    # Center the phone vertically in the middle area (between headline and subtitle)
    phone_area_top = 380
    phone_area_bottom = 2500
    phone_area_center = (phone_area_top + phone_area_bottom) // 2
    paste_y = phone_area_center - target_h // 2
    
    # Drop shadow
    add_drop_shadow(canvas, target_w, target_h, paste_x, paste_y)
    
    # Apply rounded corners mask to phone image
    mask = rounded_corner_mask((target_w, target_h), 44)
    raw_resized.putalpha(mask)
    
    canvas.paste(raw_resized, (paste_x, paste_y), raw_resized)
    
    # Draw text
    draw = ImageDraw.Draw(canvas)
    
    headline_font = get_font(96, bold=True)
    subtitle_font = get_font(48, bold=False)
    
    draw_centered_text(draw, headline, headline_y_center, headline_font, TEXT_COLOR)
    draw_centered_text(draw, subtitle, subtitle_y, subtitle_font, SUBTITLE_COLOR)
    
    # Convert to RGB for saving as PNG
    final = canvas.convert("RGB")
    final.save(output_path, "PNG", optimize=True)
    print(f"Saved: {output_path}")

screenshots = [
    {
        "raw": "raw_sessions.png",
        "out": "final_1.png",
        "headline": "Private by design.\nEncrypted by default.",
        "subtitle": "AES-256-GCM encryption. Only you can read your notes.",
    },
    {
        "raw": "raw_trends.png",
        "out": "final_2.png",
        "headline": "See how you're\nreally doing.",
        "subtitle": "Weekly mood trends. Monthly patterns. All private.",
    },
    {
        "raw": "raw_new_session.png",
        "out": "final_3.png",
        "headline": "Capture every\ninsight.",
        "subtitle": "Voice, notes, photos — organized by session.",
    },
    {
        "raw": "raw_patterns.png",
        "out": "final_4.png",
        "headline": "Understand your\nprogress.",
        "subtitle": "Discover themes across months of therapy.",
    },
    {
        "raw": "raw_settings.png",
        "out": "final_5.png",
        "headline": "Your data,\nyours alone.",
        "subtitle": "Zero-knowledge encryption. Cancel anytime.",
    },
]

for s in screenshots:
    make_screenshot(
        os.path.join(BASE, s["raw"]),
        os.path.join(BASE, s["out"]),
        s["headline"],
        s["subtitle"],
    )

print("All done!")
