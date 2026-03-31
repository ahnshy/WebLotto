'use client';
// Example header snippet that loads ThemeSwitch client-only to avoid hydration mismatches.
import dynamic from 'next/dynamic';
import * as React from 'react';
import { AppBar, Toolbar, Box } from '@mui/material';

const ThemeSwitch = dynamic(()=>import('@/components/ThemeSwitch'), { ssr:false });

export default function Header({ mode, onMode }:{ mode:'light'|'night'|'dark', onMode:(m:any)=>void }){
  return (
    <AppBar position="sticky" color="default" elevation={4}>
      <Toolbar>
        <Box sx={{ flex:1 }} />
        <ThemeSwitch value={mode} onChange={onMode}/>
      </Toolbar>
    </AppBar>
  );
}
