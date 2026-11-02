import { CONTEST } from '@/lib/config';
import { themePhotos } from '@/lib/images';
import { hhmm, lightDay, range } from '@/lib/light';

/** When today's light for each theme happens in Prague. */
function whenToday(slug: string, now: number): { tone: string; text: string } {
  const t = lightDay(now);
  switch (slug) {
    case 'zlata-hodina':
      return { tone: 'gold', text: `Dnes v Praze ${range(t.eveningGoldenStart, t.eveningBlueStart)}` };
    case 'modra-hodina':
      return { tone: 'blue', text: `Dnes v Praze ${range(t.eveningBlueStart, t.dusk)}` };
    case 'mlha':
      return { tone: 'fog', text: `Slunce dnes vychází v ${hhmm(t.sunrise)}` };
    default:
      return { tone: 'day', text: 'Kdykoli přes den' };
  }
}

export default function Themes({ now }: { now: number }) {
  return (
    <div className="themes">
      {CONTEST.themes.map((t, i) => {
        const photos = themePhotos(t.slug);
        const [main, ...more] = photos;
        const extras = more.slice(0, 3);
        const when = whenToday(t.slug, now);
        return (
          <article key={t.slug} id={t.slug} className={`theme${i % 2 === 1 ? ' flip' : ''}`}>
            <div>
              <div className="theme-media">
                {main ? (
                  <img src={main} alt={`Ukázka tématu ${t.title}, vyfoceno na OPPO Find X10 Series`} loading={i === 0 ? 'eager' : 'lazy'} />
                ) : (
                  <div className="placeholder">{t.title}</div>
                )}
              </div>
              {extras.length === 3 && (
                <div className="theme-strip">
                  {extras.map((src) => (
                    <img key={src} src={src} alt="" loading="lazy" />
                  ))}
                </div>
              )}
            </div>
            <div className="theme-text">
              <p className={`theme-when ${when.tone}`}>{when.text}</p>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
              <div className="theme-tip">
                <strong>Tip:</strong>
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
