'use client';

import React, { createContext, useContext, useState } from 'react';

export type Section =
  | '당첨번호보기'
  | '당첨 패턴 분석'
  | '난수 추출'
  | '통계기반 추출'
  | '패턴기반 추출'
  | 'AI 딥러닝 추출'
  | 'AI 머신러닝 추출'
  | '모의추첨'
  | '동기화';

type NavContextValue = {
  section: Section;
  setSection: (section: Section) => void;
};

const NavContext = createContext<NavContextValue | null>(null);

export const useNav = () => {
  const value = useContext(NavContext);
  if (!value) throw new Error('useNav outside');
  return value;
};

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [section, setSection] = useState<Section>('당첨번호보기');

  return (
    <NavContext.Provider value={{ section, setSection }}>
      {children}
    </NavContext.Provider>
  );
}
