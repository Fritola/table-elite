import React from 'react';
import '@/i18n'; // Force i18n initialization

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
