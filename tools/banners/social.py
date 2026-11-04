"""Social banners 3:4 (1080x1440) and 9:16 (1080x1920), same type system as the oppo.com banners.
On socials nothing is clickable, so the CTA row carries the real mechanic: hashtag pill + handle to tag."""
from PIL import Image, ImageDraw
import os
from make import crop_to, scrim, font, cap_top_offset, enhance, save, EYEBROW, TITLE, TAGLINE, BTN, REF_W

OUT = 'out-social'
os.makedirs(OUT, exist_ok=True)
WHITE, BLACK = (255, 255, 255), (11, 11, 11)


def draw(d, w, h, s, mx, top_y, cta_bottom, credit_y, lines):
    f_eye = font(EYEBROW * s, 400); f_title = font(TITLE * s, 500)
    f_tag = font(TAGLINE * s, 400); f_btn = font(BTN * s, 500); f_cr = font(26 * s, 400)
    x = mx
    d.text((x, top_y - cap_top_offset(f_title)), 'Lovci světla', font=f_title, fill=WHITE)
    d.text((x, top_y + 150 * s - cap_top_offset(f_eye)), 'OPPO Photo Contest  |  4.–24. 11. 2026', font=f_eye, fill=WHITE)
    yt = top_y + 242 * s
    for i, line in enumerate(lines):
        d.text((x, yt - cap_top_offset(f_tag) + i * 62 * s), line, font=f_tag, fill=WHITE)
    # CTA row: white pill with the hashtag, then plain text with the handle
    ph = 80 * s; pad = 42 * s
    label = '#OPPOLovciSvetla'
    tw = d.textlength(label, font=f_btn)
    box = (x, cta_bottom - ph, x + tw + pad * 2, cta_bottom)
    d.rounded_rectangle(box, radius=ph / 2, fill=WHITE)
    ty = box[1] + (ph - f_btn.size) / 2 - cap_top_offset(f_btn) / 2 + 2 * s
    d.text((box[0] + pad, ty), label, font=f_btn, fill=BLACK)
    d.text((box[2] + 36 * s, ty), 'Označ @oppo_cesko', font=f_btn, fill=WHITE)
    # credit: one small line, right-aligned to the same margin
    cr = 'Vyfoceno na OPPO Find X10 Series'
    d.text((w - mx - d.textlength(cr, font=f_cr), credit_y - cap_top_offset(f_cr)), cr, font=f_cr, fill=WHITE)


def render(name, size, s, top_frac, cta_frac, credit_frac, lines, scr):
    w, h = size
    im = enhance(crop_to(w / h, 0.3), size)
    im = scrim(im, **scr)
    save(im, f'{OUT}/{name}-bez-textu.jpg')
    d = ImageDraw.Draw(im)
    draw(d, w, h, s, int(w * 0.08), int(h * top_frac), int(h * cta_frac), int(h * credit_frac), lines)
    save(im, f'{OUT}/{name}-s-textem.jpg')
    print(name, size)


S = 1080 / REF_W * 2.9  # same scale as the MOBILE web banner
LINES = ['Vyfoť zimní světlo', 'a vyhraj OPPO Find X10.']
# 3:4 feed post
render('social-3x4', (1080, 1440), S, 0.58, 0.885, 0.95, LINES, dict(bottom=0.8))
# 9:16 story / reel: text kept out of the top 14 % and bottom 20 % covered by the app UI
render('social-9x16', (1080, 1920), S, 0.5, 0.745, 0.778, LINES, dict(bottom=0.95))
