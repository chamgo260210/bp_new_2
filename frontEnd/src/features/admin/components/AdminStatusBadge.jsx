const LABELS = {
  ACTIVE: '활성',
  LOCKED: '잠김',
  DISABLED: '비활성',
  USER: 'USER',
  ADMIN: 'ADMIN',
};

export default function AdminStatusBadge({ value }) {
  const normalized = String(value || 'UNKNOWN').toUpperCase();
  return (
    <span className={`admin-status admin-status--${normalized.toLowerCase()}`}>
      {LABELS[normalized] || normalized}
    </span>
  );
}
