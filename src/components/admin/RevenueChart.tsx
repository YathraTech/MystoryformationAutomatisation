'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import type { RevenueStats } from '@/types/admin';

interface RevenueChartProps {
  revenue: RevenueStats;
  title?: string;
  compact?: boolean;
}

export default function RevenueChart({ revenue, title, compact = false }: RevenueChartProps) {
  const { currentMonth, previousMonth, currentMonthLabel, previousMonthLabel, progression } = revenue;

  // Calcul des pourcentages pour le diagramme circulaire
  const maxValue = Math.max(currentMonth, previousMonth, 1);
  const currentPercentage = Math.min((currentMonth / maxValue) * 100, 100);
  const goalPercentage = Math.min((previousMonth / maxValue) * 100, 100);

  // Calcul du stroke-dasharray pour les cercles SVG
  const radius = compact ? 60 : 80;
  const circumference = 2 * Math.PI * radius;
  const currentStrokeDasharray = (currentPercentage / 100) * circumference;
  const goalStrokeDasharray = (goalPercentage / 100) * circumference;
  const viewBox = compact ? '0 0 150 150' : '0 0 200 200';
  const center = compact ? 75 : 100;
  const strokeW = compact ? 12 : 16;

  // Formatage du montant en euros
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isAboveGoal = currentMonth >= previousMonth;
  const difference = currentMonth - previousMonth;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className={compact ? 'p-3' : 'p-6'}>
        {title && (
          <h3 className={`font-semibold text-slate-700 text-center ${compact ? 'text-xs mb-2' : 'text-sm mb-4'}`}>{title}</h3>
        )}
        <div className={compact ? 'flex items-center gap-4' : 'flex flex-col items-center'}>
          {/* Diagramme circulaire SVG */}
          <div className={`relative shrink-0 ${compact ? 'w-28 h-28' : 'w-48 h-48'}`}>
            <svg className="w-full h-full transform -rotate-90" viewBox={viewBox}>
              <circle cx={center} cy={center} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeW} />
              {previousMonth > 0 && (
                <circle
                  cx={center} cy={center} r={radius} fill="none" stroke="#c7d2fe"
                  strokeWidth={strokeW} strokeDasharray={`${goalStrokeDasharray} ${circumference}`}
                  strokeLinecap="round" className="opacity-50"
                />
              )}
              <circle
                cx={center} cy={center} r={radius} fill="none"
                stroke={isAboveGoal ? '#10b981' : '#6366f1'}
                strokeWidth={strokeW} strokeDasharray={`${currentStrokeDasharray} ${circumference}`}
                strokeLinecap="round" className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-bold text-slate-800 ${compact ? 'text-lg' : 'text-2xl'}`}>
                {formatAmount(currentMonth)}
              </span>
              <span className="text-[10px] text-slate-500">ce mois</span>
            </div>
          </div>

          {/* Infos à droite (compact) ou en dessous (normal) */}
          <div className={compact ? 'flex-1 min-w-0' : 'contents'}>
            {/* Indicateur de progression */}
            <div className={`flex items-center gap-1.5 ${compact ? '' : 'mt-4'}`}>
              {isAboveGoal ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
              )}
              <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'} ${isAboveGoal ? 'text-emerald-600' : 'text-amber-600'}`}>
                {progression}% de l&apos;objectif
              </span>
            </div>

            {previousMonth > 0 && (
              <p className={`text-[10px] text-slate-500 ${compact ? 'mt-0.5' : 'mt-1'}`}>
                {isAboveGoal ? '+' : ''}{formatAmount(difference)} vs {previousMonthLabel}
              </p>
            )}

            {/* Légende compact = inline */}
            {compact ? (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                <span className="flex items-center gap-1 text-[10px] text-slate-600">
                  <span className={`h-2 w-2 rounded-full ${isAboveGoal ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                  {currentMonthLabel}: <strong>{formatAmount(currentMonth)}</strong>
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-indigo-200" />
                  {previousMonthLabel}: <strong>{formatAmount(previousMonth)}</strong>
                </span>
              </div>
            ) : (
              <div className="mt-6 pt-4 border-t border-slate-100 w-full">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${isAboveGoal ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                      <span className="text-xs text-slate-600">{currentMonthLabel}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{formatAmount(currentMonth)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-indigo-200" />
                      <span className="text-xs text-slate-600">{previousMonthLabel} (objectif)</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{formatAmount(previousMonth)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
