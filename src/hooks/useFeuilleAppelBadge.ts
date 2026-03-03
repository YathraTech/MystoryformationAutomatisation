'use client';

import { useState, useEffect } from 'react';

export function useFeuilleAppelBadge(): { pendingCount: number } {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetch('/api/admin/feuilles-appel/pending-count')
      .then((res) => res.json())
      .then((data) => setPendingCount(data.count ?? 0))
      .catch(() => setPendingCount(0));
  }, []);

  return { pendingCount };
}
