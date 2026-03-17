import { useContext } from 'react';
import { I18nContext, Language } from '@/contexts/i18n-context';

export function useI18n() {
  return useContext(I18nContext);
}

export type { Language };
