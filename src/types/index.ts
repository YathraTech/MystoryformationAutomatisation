export type {
  PersonalInfoData,
  CPFInfoData,
  FormationChoiceData,
  DisponibilitesData,
  ConsentementData,
  InscriptionCompleteData,
} from '@/lib/validations/inscription.schema';

export type { Formation } from '@/types/admin';

export interface FormStepConfig {
  number: number;
  title: string;
  shortTitle: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  details?: Record<string, string[]>;
}
