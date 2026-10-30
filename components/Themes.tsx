import { CONTEST } from '@/lib/config';
import { themePhotos } from '@/lib/images';

export default function Themes() {
  return (
    <div className="themes">
      {CONTEST.themes.map((t, i) => {
        const photos = themePhotos(t.slug);
        const [main, ...more] = photos;
        const extras = more.slice(0, 2);
        return (
          <article key={t.slug} id={t.slug} className={`theme${i % 2 === 1 ? ' flip' : ''}`}>
            <div>
              <div className="theme-media">
                {main ? (
                  <img src={main} alt={`Ukázka tématu ${t.title}, vyfoceno na OPPO Find X10 Series`} loading={i === 0 ? 'eager' : 'lazy'} />
                ) : (
                  <div className="placeholder">Ukázka | {t.title}</div>
                )}
              </div>
              {extras.length === 2 && (
                <div className="theme-strip">
                  {extras.map((src) => (
                    <img key={src} src={src} alt="" loading="lazy" />
                  ))}
                </div>
              )}
            </div>
            <div className="theme-text">
              <span className="label label-accent">Téma {i + 1}</span>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
              <div className="theme-tip">
                <strong>Tip</strong>
                <span>{t.tip}</span>
              </div>
              <span className="theme-credit">Vyfoceno na OPPO Find X10 Series s fotoaparátem Hasselblad.</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
