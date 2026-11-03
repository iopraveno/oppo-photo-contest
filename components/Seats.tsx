/** One square per place. Filled squares are confirmed places. */
export default function Seats({ filled, total, size = 'md' }: { filled: number; total: number; size?: 'md' | 'lg' }) {
  return (
    <div className={`seats seats-${size}`} role="img" aria-label={`Potvrzeno ${Math.min(filled, total)} z ${total} míst`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`seat${i < filled ? ' on' : ''}`} />
      ))}
    </div>
  );
}
