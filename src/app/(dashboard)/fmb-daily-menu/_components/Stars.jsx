export const RATING_LABEL = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

export default function Stars({ value, size = 'text-base' }) {
  const filled = Math.round(value || 0);
  return (
    <span className={size}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ color: n <= filled ? '#f59e0b' : '#e5e7eb' }}>★</span>
      ))}
    </span>
  );
}
