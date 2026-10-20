// Small inline icon set (stroke icons, 24px grid)
const base = {
  width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true,
};
const I = (paths) => function Icon({ className = '', size = 22 }) {
  return <svg {...base} width={size} height={size} className={className}>{paths}</svg>;
};

export const HomeIcon = I(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>);
export const CarIcon = I(<><path d="M5 17h14v-5l-2-5H7l-2 5v5Z" /><path d="M5 12h14" /><circle cx="8" cy="17" r="1.6" /><circle cx="16" cy="17" r="1.6" /></>);
export const ClockIcon = I(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const SteeringIcon = I(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.5" /><path d="M12 14.5V21M9.6 11.3 3.4 9.6M14.4 11.3l6.2-1.7" /></>);
export const BackIcon = I(<path d="M15 5l-7 7 7 7" />);
export const PinIcon = I(<><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>);
export const FlagIcon = I(<><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>);
export const GpsIcon = I(<><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>);
export const SearchIcon = I(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const ReceiptIcon = I(<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></>);
export const StarIcon = ({ className = '', size = 22, filled = false }) => (
  <svg {...base} width={size} height={size} className={className} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
  </svg>
);
export const CheckIcon = I(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const XIcon = I(<path d="M6 6l12 12M18 6 6 18" />);
export const ChevronIcon = I(<path d="m9 5 7 7-7 7" />);
export const CardIcon = I(<><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18" /></>);
