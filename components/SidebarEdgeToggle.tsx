'use client';
import * as React from 'react';
import { IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import { SIDEBAR_FULL, SIDEBAR_MINI } from './Sidebar';

export default function SidebarEdgeToggle({ collapsed, setCollapsed }:{ collapsed:boolean; setCollapsed:(v:boolean)=>void }){
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  if(!isMdUp) return null;
  // Hug the very edge so it doesn't cover content; near the logo vertically
  const left = collapsed ? 6 : (SIDEBAR_FULL - 28);
  return (
    <Tooltip title={collapsed ? '사이드바 열기' : '사이드바 닫기'} placement="right" arrow>
      <IconButton
        size="small"
        sx={{ position:'fixed', top:14, left, zIndex:(t)=>t.zIndex.appBar+2,
              borderRadius:2, bgcolor:'background.paper', boxShadow:3, '&:hover':{ bgcolor:'background.paper' } }}
        onClick={()=>setCollapsed(!collapsed)}>
        {collapsed ? <KeyboardDoubleArrowRightIcon/> : <KeyboardDoubleArrowLeftIcon/>}
      </IconButton>
    </Tooltip>
  );
}
