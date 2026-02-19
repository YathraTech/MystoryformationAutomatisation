'use client';

import { TrendingUp, TrendingDown, Target } from 'lucide-react';
import type { CommercialRevenue } from '@/types/admin';

interface CommercialRevenueCardProps {
  data: CommercialRevenue;
}

export default function CommercialRevenueCard({ data }: CommercialRevenueCardProps) {
  const { nom, prenom, currentMonth, objectifCa, progression } = data;

  const hasObjectif = objectifCa !== null && objectifCa > 0;
  const isAboveGoal = hasObjectif && currentMonth >= objectifCa;

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  // Mini SVG ring
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const percentage = hasObjectif ? Math.min(progression, 100) : 0;
  const strokeDasharray = (percentage / 100) * circumference;

  return (
    <div className={`rounded-xl border p-4 ${isAboveGoal ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center gap-3">
        {/* Mini progress ring */}
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="6" />
            {hasObjectif && (
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                stroke={isAboveGoal ? '#10b981' : '#6366f1'}
                strokeWidth="6"
                strokeDasharray={`${strokeDasharray} ${circumference}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-700">
              {hasObjectif ? `${progression}%` : '-'}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {prenom} {nom}
          </p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">
            {formatAmount(currentMonth)}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            {hasObjectif ? (
              <>
                <Target className="h-3 w-3 text-slate-400" />
                <span className="text-xs text-slate-500">
                  Obj: {formatAmount(objectifCa)}
                </span>
                {isAboveGoal ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500 ml-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-amber-500 ml-1" />
                )}
              </>
            ) : (
              <span className="text-xs text-slate-400 italic">Objectif non défini</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
