// Shared labels/colours for ride status (used on client pages)
export const STATUS_STEPS = ['paid', 'accepted', 'in_progress', 'completed'];

export const STATUS_INFO = {
  paid: { label: 'Finding a driver', badge: 'bg-taxi-soft text-ink' },
  accepted: { label: 'Driver on the way', badge: 'bg-taxi text-ink' },
  in_progress: { label: 'On the trip', badge: 'bg-ink text-taxi' },
  completed: { label: 'Completed', badge: 'bg-go-soft text-go' },
  cancelled: { label: 'Cancelled', badge: 'bg-stop-soft text-stop' },
};

export const statusLabel = (s) => STATUS_INFO[s]?.label || s || 'Unknown';
export const statusBadge = (s) => STATUS_INFO[s]?.badge || 'bg-surface text-road';

// Cancelling after a driver has accepted costs a small fee
export const CANCEL_FEE_AFTER_ACCEPT = 25;

// Share of the fare paid to the driver
export const DRIVER_SHARE = 0.8;
