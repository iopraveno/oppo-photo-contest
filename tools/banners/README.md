# Bannery a sdílecí obrázky

Skripty, kterými vznikly bannery pro oppo.com/cz, sociální sítě, sdílecí obrázky a favicon webu.

- `make.py`: bannery na oppo.com/cz (PC 3574×1286 podle změřeného banneru Find X9 Ultra, PAD 1536×1024, MOBILE 1080×1440), s textem i bez
- `social.py`: socials 3:4 (1080×1440) a 9:16 (1080×1920), s textem i bez; text mimo zónu, kterou překrývá rozhraní Instagramu
- `og.py`: sdílecí obrázek webu 1200×630, pozadí pro náhledy fotek a favicony

Potřebují:
- `src.jpg` vedle skriptů: fotka západu slunce z OPPO Find X10 Series (položka 212 ze sdílené složky assetů s vodoznakem, 5888×4416)
- písmo OPPO Sans 4.0 (TTF z npm balíčku `@fontpkg/oppo-sans-4-0`); cestu uprav v `make.py` (`FONT`)
- Python s Pillow: `pip install pillow`, pak `python3 make.py`, `python3 social.py`, `python3 og.py`
