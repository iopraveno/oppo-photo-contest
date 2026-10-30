import { mosaicPhotos } from '@/lib/images';

// Grid spans per position: a few wide or tall tiles break the rhythm.
const spans = ['big', 'wide', 'tall', '', '', 'wide', 'big', '', 'tall', 'wide', '', 'wide'];

export default function Mosaic() {
  const photos = mosaicPhotos();
  if (photos.length === 0) return null;
  return (
    <div className="mosaic">
      {photos.map((src, i) => (
        <figure key={src} className={`mosaic-item ${spans[i % spans.length]}`}>
          <img src={src} alt="" loading="lazy" />
        </figure>
      ))}
    </div>
  );
}
