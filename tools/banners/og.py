"""Share images (1200x630) and favicons for the contest website."""
from PIL import Image, ImageDraw
import os
from make import crop_to, scrim, font, cap_top_offset

OUT = 'out-web'
os.makedirs(OUT, exist_ok=True)
W, H = 1200, 630
WHITE = (255, 255, 255)
LOGO_WHITE = Image.open('/home/claude/oppo-photo-contest/public/img/oppo-logo-white.png').convert('RGBA')


def logo(width):
    lw = int(width)
    lh = int(LOGO_WHITE.height * lw / LOGO_WHITE.width)
    return LOGO_WHITE.resize((lw, lh), Image.LANCZOS)


def base(strength):
    im = crop_to(W / H, 0.36).resize((W, H), Image.LANCZOS)
    im = scrim(im, left=strength, bottom=0.25)
    lg = logo(150)
    im.paste(lg, (64, 58), lg)
    return im


# Background for per-photo share images (text is drawn by the website).
bg = base(0.78)
d = ImageDraw.Draw(bg)
f_cr = font(20, 400)
cr = 'Vyfoceno na OPPO Find X10 Series'
d.text((W - 64 - d.textlength(cr, font=f_cr), H - 56 - cap_top_offset(f_cr)), cr, font=f_cr, fill=WHITE)
bg.save(f'{OUT}/og-bg.jpg', quality=88, optimize=True, progressive=True)

# Default share image for the whole site.
im = base(0.7)
d = ImageDraw.Draw(im)
x = 64
f_title = font(112, 500)
f_eye = font(30, 400)
f_tag = font(40, 400)
f_url = font(28, 500)
top = 170
d.text((x, top - cap_top_offset(f_title)), 'Lovci světla', font=f_title, fill=WHITE)
d.text((x, top + 140 - cap_top_offset(f_eye)), 'OPPO Photo Contest  |  4.–24. 11. 2026', font=f_eye, fill=WHITE)
d.text((x, top + 210 - cap_top_offset(f_tag)), 'Vyfoť zimní světlo a vyhraj', font=f_tag, fill=WHITE)
d.text((x, top + 262 - cap_top_offset(f_tag)), 'OPPO Find X10.', font=f_tag, fill=WHITE)
# Address as a white pill, the same shape as the banner buttons
label = 'opposoutez.cz'
tw = d.textlength(label, font=f_url)
ph, pad = 64, 34
box = (x, H - 64 - ph, x + tw + pad * 2, H - 64)
d.rounded_rectangle(box, radius=ph / 2, fill=WHITE)
d.text((x + pad, box[1] + (ph - f_url.size) / 2 - cap_top_offset(f_url) / 2 + 2), label, font=f_url, fill=(11, 11, 11))
d.text((W - 64 - d.textlength(cr, font=f_cr), H - 64 - ph / 2 - 10), cr, font=f_cr, fill=WHITE)
im.save(f'{OUT}/og.jpg', quality=88, optimize=True, progressive=True)

# Favicons: white OPPO wordmark on black, rounded square for app icons.
def icon(size, rounded):
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * 0.22) if rounded else 0, fill=255)
    canvas.paste(Image.new('RGBA', (size, size), (11, 11, 11, 255)), (0, 0), mask)
    lg = logo(size * 0.8)
    canvas.paste(lg, ((size - lg.width) // 2, (size - lg.height) // 2), lg)
    return canvas


icon(512, False).save(f'{OUT}/icon-512.png')
icon(192, False).save(f'{OUT}/icon-192.png')
icon(180, False).convert('RGB').save(f'{OUT}/apple-icon.png')  # iOS rounds the corners itself
icon(512, True).save(f'{OUT}/icon.png')
ico = icon(256, True)
ico.save(f'{OUT}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print('ok')
