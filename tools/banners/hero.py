"""Website hero from the same photo: top 86 % of the frame (keeps the watermark out), sRGB, sharpened, two sizes."""
from make import SRC, enhance, SRGB_ICC
W0, H0 = SRC.size
crop = SRC.crop((0, 0, W0, int(W0 / (2600 / 1677))))
for width, name, q in [(2880, 'hero.jpg', 86), (1280, 'hero-1280.jpg', 84)]:
    size = (width, round(width * crop.height / crop.width))
    im = enhance(crop, size)
    im.save(f'out-web/{name}', quality=q, subsampling=0, optimize=True, progressive=True, icc_profile=SRGB_ICC)
    print(name, size)
