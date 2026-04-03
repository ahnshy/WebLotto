'use client';
import React, { createContext, useContext, useState } from 'react';

export type Section = '당첨번호보기' | '당첨 패턴 분석' | '난수 추출' | '동기화';

type Ctx = {
  section: Section;
  setSection: (s: Section) => void;
};

const NavContext = createContext<Ctx | null>(null);

export const useNav = () => {
  const v = useContext(NavContext);
  if (!v) throw new Error('useNav outside');
  return v;
};

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [section, setSection] = useState<Section>('당첨번호보기');
  return <NavContext.Provider value={{ section, setSection }}>{children}</NavContext.Provider>;
}
