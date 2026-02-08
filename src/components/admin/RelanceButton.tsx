'use client';

import { useState } from 'react';
import { PhoneCall, X, Send } from 'lucide-react';

interface RelanceButtonProps {
  rowIndex: number;
  onDone: () => void;
}

export default function RelanceButton({ rowIndex, onDone }: RelanceButtonProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/inscriptions/${rowIndex}/relance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note }),
        }
      );
      if (res.ok) {
        setOpen(false);
        setNote('');
        onDone();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
      >
        <PhoneCall className="h-3.5 w-3.5" />
        Relance
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700">
          Note de relance
        </span>
        <button
          onClick={() => setOpen(false)}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        rows={2}
        className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
        placeholder="Note optionnelle..."
      />
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="self-end inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
      >
        <Send className="h-3.5 w-3.5" />
        {saving ? 'Envoi...' : 'Enregistrer'}
      </button>
    </div>
  );
}
