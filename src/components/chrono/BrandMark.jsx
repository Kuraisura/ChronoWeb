export default function BrandMark({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-label="Chrono" role="img">
      <circle cx="8" cy="6" r="4" fill="rgb(var(--chrono-accent))" />
      <circle cx="8" cy="15" r="3.25" fill="rgb(var(--chrono-accent))" opacity="0.35" />
    </svg>
  );
}
