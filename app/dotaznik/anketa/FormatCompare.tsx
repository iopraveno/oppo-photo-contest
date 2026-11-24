// A regular phone next to the wide one, same height, so the difference reads as width. Plain outlines, no brand.
import s from './anketa.module.css';

export default function FormatCompare({ note }: { note: string }) {
  return (
    <figure className={s.compare}>
      <div className={s.phones}>
        <div className={s.phoneCol}>
          <div className={`${s.phone} ${s.phoneRegular}`} aria-hidden>
            <span className={s.screen} />
          </div>
          <p className={s.phoneName}>Běžný telefon</p>
          <p className={s.phoneRatio}>zhruba 20:9</p>
        </div>
        <div className={s.phoneCol}>
          <div className={`${s.phone} ${s.phoneWide}`} aria-hidden>
            <span className={s.screen} />
          </div>
          <p className={s.phoneName}>Široký telefon</p>
          <p className={s.phoneRatio}>zhruba 16:10</p>
        </div>
      </div>
      <figcaption className={s.compareNote}>{note}</figcaption>
    </figure>
  );
}
