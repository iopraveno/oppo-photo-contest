from PIL import Image, ImageDraw, ImageFont
import os

SRC = Image.open('src.jpg').convert('RGB')
W0, H0 = SRC.size
FONT = '/home/claude/fontpkg/x/package/OPPO Sans 4.0.ttf'
OUT = 'out'
os.makedirs(OUT, exist_ok=True)
SUN = (0.478, 0.38)

# Measured on the oppo.com/cz Find X9 Ultra banner (3574x1286):
# side margin 476/3574 = 0.133 W, title cap-top at 132/1286 = 0.103 H, pill bottom at 1153/1286 = 0.897 H,
# title cap height 76 px, eyebrow 25 px, tagline 37 px, pill 80 px tall, right credit lines 22 + 45 px.
REF_W = 3574
EYEBROW, TITLE, TAGLINE, BTN, CREDIT_S, CREDIT_L = 34, 105, 51, 34, 30, 60

def font(size, weight):
    f = ImageFont.truetype(FONT, int(size))
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f

def crop_to(ratio, sun_y_frac, max_bottom=0.88):
    if W0 / H0 > ratio:
        h = int(H0 * max_bottom); w = int(h * ratio)
        cx = int(W0 * SUN[0]); x = min(max(0, cx - w // 2), W0 - w); y = 0
    else:
        w = W0; h = int(w / ratio)
        sy = int(H0 * SUN[1]); y = int(sy - h * sun_y_frac)
        y = max(0, min(y, int(H0 * max_bottom) - h)); x = 0
    return SRC.crop((x, y, x + w, y + h))

def scrim(im, left=0.0, bottom=0.0):
    w, h = im.size
    overlay = Image.new('L', (w, h), 0); px = overlay.load()
    for x in range(w):
        lv = left * max(0.0, 1 - (x / w) / 0.6) ** 1.4 if left else 0
        for y in range(h):
            bv = bottom * max(0.0, ((y / h) - 0.4) / 0.6) ** 1.3 if bottom else 0
            px[x, y] = int(min(1.0, lv + bv) * 255)
    return Image.composite(Image.new('RGB', (w, h), (8, 8, 8)), im, overlay)

def cap_top_offset(f, text='H'):
    """Distance from the drawing origin to the top of capital letters, so we can place by cap-top like the reference."""
    return f.getbbox(text)[1]

def draw_text_block(d, w, h, s, mx, top_y, bottom_y, lines, credit_right=True):
    """s = scale factor relative to the 3574-wide reference."""
    white = (255, 255, 255)
    f_eye = font(EYEBROW * s, 400); f_title = font(TITLE * s, 500); f_tag = font(TAGLINE * s, 400); f_btn = font(BTN * s, 500)
    x = mx
    # title: cap-top at top_y (reference: title first, eyebrow below it)
    y = top_y - cap_top_offset(f_title)
    d.text((x, y), 'Lovci světla', font=f_title, fill=white)
    # eyebrow: reference gap cap-top(title) -> cap-top(eyebrow) = 150 px
    ye = top_y + 150 * s - cap_top_offset(f_eye)
    d.text((x, ye), 'OPPO Photo Contest  |  4.–24. 11. 2026', font=f_eye, fill=white)
    # tagline: reference cap-top at title + 242 px
    yt = top_y + 242 * s
    for i, line in enumerate(lines):
        d.text((x, yt - cap_top_offset(f_tag) + i * 62 * s), line, font=f_tag, fill=white)
    # buttons: pill 80 px tall, bottom at bottom_y; text 'Zapojit se' + underlined 'Hlasovat' 36 px gap
    ph = 80 * s; pw_pad = 42 * s
    tw = d.textlength('Zapojit se', font=f_btn)
    box = (x, bottom_y - ph, x + tw + pw_pad * 2, bottom_y)
    d.rounded_rectangle(box, radius=ph / 2, fill=white)
    ty = box[1] + (ph - f_btn.size) / 2 - cap_top_offset(f_btn) / 2 + 2 * s
    d.text((box[0] + pw_pad, ty), 'Zapojit se', font=f_btn, fill=(11, 11, 11))
    bx = box[2] + 36 * s
    d.text((bx, ty), 'Hlasovat', font=f_btn, fill=white)
    tw2 = d.textlength('Hlasovat', font=f_btn)
    uy = ty + cap_top_offset(f_btn) + f_btn.size * 0.78 + 8 * s
    d.line((bx, uy, bx + tw2, uy), fill=white, width=max(2, int(2.5 * s)))
    # right credit: two lines, right-aligned to the same margin, baseline block ends at bottom_y - 22 px (ref 1175 vs 1153)
    if credit_right:
        f_cs = font(CREDIT_S * s, 400); f_cl = font(CREDIT_L * s, 700)
        l1, l2 = 'Vyfoceno na', 'Find X10 Series'
        rx = w - mx
        y2 = bottom_y + 22 * s - f_cl.size
        d.text((rx - d.textlength(l2, font=f_cl), y2), l2, font=f_cl, fill=white)
        y1 = y2 - 36 * s
        d.text((rx - d.textlength(l1, font=f_cs), y1), l1, font=f_cs, fill=white)

def render(name, size, sun_y, s, mx_frac, top_frac, bottom_frac, lines, scr, credit_right=True):
    w, h = size
    im = crop_to(w / h, sun_y).resize(size, Image.LANCZOS)
    im = scrim(im, **scr)
    im.save(f'{OUT}/{name}-bez-textu.jpg', quality=92, optimize=True, progressive=True)
    d = ImageDraw.Draw(im)
    draw_text_block(d, w, h, s, int(w * mx_frac), int(h * top_frac), int(h * bottom_frac), lines, credit_right)
    im.save(f'{OUT}/{name}-s-textem.jpg', quality=92, optimize=True, progressive=True)
    print(name, size)

if __name__ == '__main__':
    # PC: exact reference geometry
    render('pc', (3574, 1286), 0.36, 1.0, 0.133, 0.103, 0.897, ['Vyfoť zimní světlo a vyhraj OPPO Find X10.'], dict(left=0.62))
    # PAD and MOBILE: same type scale relative to width, text block at the bottom third
    render('pad', (1536, 1024), 0.3, 1536 / REF_W * 1.9, 0.08, 0.5, 0.9, ['Vyfoť zimní světlo a vyhraj OPPO Find X10.'], dict(left=0.5, bottom=0.55))
    render('mobile', (1080, 1440), 0.3, 1080 / REF_W * 2.9, 0.08, 0.6, 0.92, ['Vyfoť zimní světlo', 'a vyhraj OPPO Find X10.'], dict(bottom=0.78), credit_right=False)
