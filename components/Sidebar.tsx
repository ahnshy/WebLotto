'use client';
import * as React from 'react';
import {
    Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
    Collapse, Divider, useMediaQuery, IconButton, Tooltip, Typography, alpha
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import CasinoIcon from '@mui/icons-material/Casino';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import Image from 'next/image';
import { useNav } from './NavContext';
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

export const SIDEBAR_FULL = 280;
export const SIDEBAR_MINI = 80;

/** ChatGPT 스타일 사이드바 with 다크/라이트/나이트 테마 지원 */
export default function Sidebar({
                                    open, onClose, collapsed, setCollapsed
                                }:{ open:boolean; onClose:()=>void; collapsed:boolean; setCollapsed:(v:boolean)=>void }){

    const { section, setSection } = useNav();
    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

    const [open1, setOpen1] = React.useState(true);
    const [open2, setOpen2] = React.useState(true);

    const width = collapsed ? SIDEBAR_MINI : SIDEBAR_FULL;
    const ItemText = ({primary}:{primary:string}) => collapsed ? null : <ListItemText primary={primary} />;

    // 테마별 스타일 정의
    const isDark = theme.palette.mode === 'dark';
    const isNight = theme.palette.background.paper === '#151b2f';

    const menuItemHoverBg = isNight
        ? alpha('#4f46e5', 0.15)  // 나이트: 인디고 계열
        : isDark
        ? alpha('#90caf9', 0.12)  // 다크: 라이트 블루
        : alpha('#3b82f6', 0.08); // 라이트: 블루

    const menuItemSelectedBg = isNight
        ? alpha('#4f46e5', 0.25)
        : isDark
        ? alpha('#90caf9', 0.2)
        : alpha('#3b82f6', 0.12);

    const menuItemBorderRadius = 10;

    const content = (
        <Box role="presentation" sx={{
            width,
            display:'flex',
            flexDirection:'column',
            height:'100%',
            bgcolor: theme.palette.background.paper,
            borderRight: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
            transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
            {/* 상단: 로고 및 제목 */}
            <Box sx={{
                display:'flex',
                alignItems:'center',
                gap: collapsed ? 0.5 : 1.5,
                px: 1.5,
                py: 1.5,
                height: 64,
                borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
            }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    flexShrink: 0
                }}>
                    <Image src="/favicon-32.png" alt="WebLotto" width={24} height={24} />
                </Box>
                {!collapsed && (
                    <Typography
                        sx={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            letterSpacing: '-0.3px',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        WebLotto
                    </Typography>
                )}
                <Box sx={{ flex:1 }} />
                {isMdUp && (
                    <Tooltip title={collapsed ? '펼치기' : '접기'} placement="right">
                        <IconButton
                            size="small"
                            onClick={()=>setCollapsed(!collapsed)}
                            sx={{
                                color: 'action.active',
                                '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.08) }
                            }}
                        >
                            {collapsed ? <KeyboardDoubleArrowRightIcon fontSize="small"/> : <KeyboardDoubleArrowLeftIcon fontSize="small"/>}
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {/* 중간: 메뉴 목록 */}
            <List subheader={null} sx={{
                pt: 1.5,
                px: 1,
                flex:1,
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                    width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                    bgcolor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                    bgcolor: alpha(theme.palette.text.primary, 0.1),
                    borderRadius: '3px',
                    '&:hover': {
                        bgcolor: alpha(theme.palette.text.primary, 0.15),
                    }
                }
            }}>
                {/* 분석 섹션 헤더 */}
                <ListItemButton
                    onClick={()=>setOpen1(!open1)}
                    sx={{
                        borderRadius: menuItemBorderRadius,
                        mb: 0.5,
                        px: 1.5,
                        py: 1,
                        '&:hover': {
                            bgcolor: menuItemHoverBg,
                        },
                        transition: 'all 0.2s ease'
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                        <AnalyticsIcon sx={{ fontSize: '1.25rem' }}/>
                    </ListItemIcon>
                    <ItemText primary="분석" />
                    {collapsed ? null : (open1 ? <ExpandLess sx={{ fontSize: '1.2rem' }} /> : <ExpandMore sx={{ fontSize: '1.2rem' }} />)}
                </ListItemButton>
                <Collapse in={open1 || collapsed} timeout="auto" unmountOnExit={!collapsed}>
                    <List component="div" disablePadding sx={{ mb: 1 }}>
                        <ListItemButton
                            selected={section==='당첨번호보기'}
                            sx={{
                                borderRadius: menuItemBorderRadius,
                                mx: 0.5,
                                mb: 0.5,
                                pl: collapsed ? 1.5 : 3,
                                py: 0.875,
                                bgcolor: section==='당첨번호보기' ? menuItemSelectedBg : 'transparent',
                                '&:hover': {
                                    bgcolor: menuItemHoverBg,
                                },
                                '&.Mui-selected': {
                                    bgcolor: menuItemSelectedBg,
                                    '&:hover': { bgcolor: menuItemSelectedBg }
                                },
                                transition: 'all 0.2s ease'
                            }}
                            onClick={()=>{ setSection('당첨번호보기'); if(!isMdUp) onClose(); }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <EmojiEventsIcon sx={{ fontSize: '1.1rem' }}/>
                            </ListItemIcon>
                            <ItemText primary="당첨번호보기" />
                        </ListItemButton>

                        <ListItemButton
                            selected={section==='당첨 패턴 분석'}
                            sx={{
                                borderRadius: menuItemBorderRadius,
                                mx: 0.5,
                                mb: 0.5,
                                pl: collapsed ? 1.5 : 3,
                                py: 0.875,
                                bgcolor: section==='당첨 패턴 분석' ? menuItemSelectedBg : 'transparent',
                                '&:hover': {
                                    bgcolor: menuItemHoverBg,
                                },
                                '&.Mui-selected': {
                                    bgcolor: menuItemSelectedBg,
                                    '&:hover': { bgcolor: menuItemSelectedBg }
                                },
                                transition: 'all 0.2s ease'
                            }}
                            onClick={()=>{ setSection('당첨 패턴 분석'); if(!isMdUp) onClose(); }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <BubbleChartIcon sx={{ fontSize: '1.1rem' }}/>
                            </ListItemIcon>
                            <ItemText primary="당첨 패턴 분석" />
                        </ListItemButton>
                    </List>
                </Collapse>

                <Divider sx={{ my: 0.5, opacity: 0.5 }} />

                {/* 추출 섹션 헤더 */}
                <ListItemButton
                    onClick={()=>setOpen2(!open2)}
                    sx={{
                        borderRadius: menuItemBorderRadius,
                        mb: 0.5,
                        px: 1.5,
                        py: 1,
                        '&:hover': {
                            bgcolor: menuItemHoverBg,
                        },
                        transition: 'all 0.2s ease'
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                        <CasinoIcon sx={{ fontSize: '1.25rem' }}/>
                    </ListItemIcon>
                    <ItemText primary="추출" />
                    {collapsed ? null : (open2 ? <ExpandLess sx={{ fontSize: '1.2rem' }} /> : <ExpandMore sx={{ fontSize: '1.2rem' }} />)}
                </ListItemButton>
                <Collapse in={open2 || collapsed} timeout="auto" unmountOnExit={!collapsed}>
                    <List component="div" disablePadding sx={{ mb: 1 }}>
                        <ListItemButton
                            selected={section==='예상번호 추출'}
                            sx={{
                                borderRadius: menuItemBorderRadius,
                                mx: 0.5,
                                mb: 0.5,
                                pl: collapsed ? 1.5 : 3,
                                py: 0.875,
                                bgcolor: section==='예상번호 추출' ? menuItemSelectedBg : 'transparent',
                                '&:hover': {
                                    bgcolor: menuItemHoverBg,
                                },
                                '&.Mui-selected': {
                                    bgcolor: menuItemSelectedBg,
                                    '&:hover': { bgcolor: menuItemSelectedBg }
                                },
                                transition: 'all 0.2s ease'
                            }}
                            onClick={()=>{ setSection('예상번호 추출'); if(!isMdUp) onClose(); }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <AutoFixHighIcon sx={{ fontSize: '1.1rem' }}/>
                            </ListItemIcon>
                            <ItemText primary="예상번호 추출" />
                        </ListItemButton>

                        {/* 동기화 메뉴를 추출 섹션 하단에 추가 */}
                        <ListItemButton
                            selected={section==='동기화'}
                            sx={{
                                borderRadius: menuItemBorderRadius,
                                mx: 0.5,
                                mb: 0.5,
                                pl: collapsed ? 1.5 : 3,
                                py: 0.875,
                                bgcolor: section==='동기화' ? menuItemSelectedBg : 'transparent',
                                '&:hover': {
                                    bgcolor: menuItemHoverBg,
                                },
                                '&.Mui-selected': {
                                    bgcolor: menuItemSelectedBg,
                                    '&:hover': { bgcolor: menuItemSelectedBg }
                                },
                                transition: 'all 0.2s ease'
                            }}
                            onClick={()=>{ setSection('동기화'); if(!isMdUp) onClose(); }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <CloudSyncIcon sx={{ fontSize: '1.1rem' }}/>
                            </ListItemIcon>
                            <ItemText primary="동기화" />
                        </ListItemButton>
                    </List>
                </Collapse>
            </List>

            {/* 하단 고정 영역 - 불필요하므로 제거 */}
        </Box>
    );

    return isMdUp ? (
        <Drawer variant="permanent" open
                sx={{ height: '100%', '& .MuiDrawer-paper': { position: 'relative', width, height: '100%', transition:'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxSizing:'border-box', overflow: 'hidden' } }}>
            {content}
        </Drawer>
    ) : (
        <Drawer variant="temporary" open={open} onClose={onClose} ModalProps={{ keepMounted: true }}
                sx={{ '& .MuiDrawer-paper': { width, boxSizing:'border-box' } }}>
            {content}
        </Drawer>
    );
}
