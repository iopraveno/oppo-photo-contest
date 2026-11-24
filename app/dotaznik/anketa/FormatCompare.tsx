// Regular phone next to the wide one, in rough real proportions (about 72 x 148 mm and 82 x 128 mm):
// the wide one is lower and a bit wider. Plain outlines, no brand.
import s from './anketa.module.css';

export default function FormatCompare() {
  return (
    <figure className={s.figureWrap} aria-label="Běžný telefon v poměru zhruba 20:9 vedle nižšího a širšího telefonu v poměru zhruba 16:10">
      <div className={s.phones}>
        <div className={s.phone}>
          <div className={`${s.body} ${s.regular}`} aria-hidden />
          <div className={s.caption}>
            <div className={s.name}>Běžný telefon</div>
            <div className={s.ratio}>zhruba 20:9</div>
          </div>
        </div>
        <div className={s.phone}>
          <div className={`${s.body} ${s.wide}`} aria-hidden />
          <div className={s.caption}>
            <div className={s.name}>Široký telefon</div>
            <div className={s.ratio}>zhruba 16:10</div>
          </div>
        </div>
      </div>
    </figure>
  );
}
