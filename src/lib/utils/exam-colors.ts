export interface PlanningColorSet {
  bg: string;
  border: string;
  icon: string;
  legendBg: string;
  legendBorder: string;
}

const COLOR_TO_PLANNING_CLASSES: Record<string, PlanningColorSet> = {
  blue: {
    bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600',
    legendBg: 'bg-blue-100', legendBorder: 'border-blue-300',
  },
  emerald: {
    bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600',
    legendBg: 'bg-emerald-100', legendBorder: 'border-emerald-300',
  },
  purple: {
    bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600',
    legendBg: 'bg-purple-100', legendBorder: 'border-purple-300',
  },
  orange: {
    bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600',
    legendBg: 'bg-orange-100', legendBorder: 'border-orange-300',
  },
  red: {
    bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600',
    legendBg: 'bg-red-100', legendBorder: 'border-red-300',
  },
  teal: {
    bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-600',
    legendBg: 'bg-teal-100', legendBorder: 'border-teal-300',
  },
  rose: {
    bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-600',
    legendBg: 'bg-rose-100', legendBorder: 'border-rose-300',
  },
  amber: {
    bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600',
    legendBg: 'bg-amber-100', legendBorder: 'border-amber-300',
  },
  slate: {
    bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-600',
    legendBg: 'bg-slate-100', legendBorder: 'border-slate-300',
  },
  cyan: {
    bg: 'bg-cyan-50', border: 'border-cyan-200', icon: 'text-cyan-600',
    legendBg: 'bg-cyan-100', legendBorder: 'border-cyan-300',
  },
  indigo: {
    bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-600',
    legendBg: 'bg-indigo-100', legendBorder: 'border-indigo-300',
  },
  pink: {
    bg: 'bg-pink-50', border: 'border-pink-200', icon: 'text-pink-600',
    legendBg: 'bg-pink-100', legendBorder: 'border-pink-300',
  },
  lime: {
    bg: 'bg-lime-50', border: 'border-lime-200', icon: 'text-lime-600',
    legendBg: 'bg-lime-100', legendBorder: 'border-lime-300',
  },
};

const DEFAULT_COLOR: PlanningColorSet = COLOR_TO_PLANNING_CLASSES.blue;

export function getPlanningColorForExamType(colorName: string): PlanningColorSet {
  return COLOR_TO_PLANNING_CLASSES[colorName] || DEFAULT_COLOR;
}
