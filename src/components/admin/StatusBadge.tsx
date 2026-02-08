import type { InscriptionStatus } from '@/types/admin';

const statusConfig: Record<
  InscriptionStatus,
  { label: string; className: string }
> = {
  'En attente': {
    label: 'En attente',
    className: 'bg-amber-100 text-amber-800',
  },
  Validee: {
    label: 'Validée',
    className: 'bg-green-100 text-green-800',
  },
  Refusee: {
    label: 'Refusée',
    className: 'bg-red-100 text-red-800',
  },
  Archivee: {
    label: 'Archivée',
    className: 'bg-slate-100 text-slate-600',
  },
};

export default function StatusBadge({ status }: { status: InscriptionStatus }) {
  const config = statusConfig[status] || statusConfig['En attente'];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
