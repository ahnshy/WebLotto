'use client';

import React, {createContext, useContext, useState} from 'react';

export const SECTION_IDS = {
  winnings: 'winnings',
  patternAnalysis: 'patternAnalysis',
  random: 'random',
  stat: 'stat',
  pattern: 'pattern',
  aiLstm: 'aiLstm',
  aiRandomForest: 'aiRandomForest',
  simulation: 'simulation',
  sync: 'sync'
} as const;

export type Section = (typeof SECTION_IDS)[keyof typeof SECTION_IDS];

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

export function NavProvider({children}: {children: React.ReactNode}) {
  const [section, setSection] = useState<Section>(SECTION_IDS.winnings);

  return (
    <NavContext.Provider value={{section, setSection}}>
      {children}
    </NavContext.Provider>
  );
}
