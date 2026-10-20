// Wordmark shaped like the lit "TAXI" sign on a Mumbai kaali-peeli roof
export default function Logo({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'text-base px-2.5 pt-1 pb-0.5',
    md: 'text-xl px-3 pt-1.5 pb-1',
    lg: 'text-4xl px-5 pt-3 pb-2',
  };
  return (
    <span className={`inline-flex flex-col items-stretch ${className}`} aria-label="cabTaxi">
      <span
        className={`rounded-t-[14px] rounded-b-md bg-taxi font-display font-extrabold leading-none tracking-tight text-ink ${sizes[size]}`}
      >
        cabtaxi
      </span>
      <span className="checker h-1.5 rounded-b-sm" aria-hidden="true" />
    </span>
  );
}
