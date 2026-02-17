// @TASK P1-S0-T1 - 공통 대시보드 레이아웃: Sidebar
// @SPEC docs/planning/03-user-flow.md#대시보드

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  History,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    label: '홈',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: '작업 이력',
    href: '/tasks',
    icon: History,
  },
  {
    label: '설정',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isCollapsed ? 64 : 240,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
      className={cn(
        'relative hidden lg:flex flex-col border-r border-slate-200 bg-white',
        className
      )}
    >
      {/* 로고 영역 */}
      <div className="h-16 flex items-center justify-center border-b border-slate-200">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xl font-bold text-blue-600"
            >
              AI System
            </motion.div>
          ) : (
            <motion.div
              key="logo-short"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xl font-bold text-blue-600"
            >
              AI
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                'hover:bg-slate-100',
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-700'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-600' : 'text-slate-500'
                )}
              />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* 하단 액션 */}
      <div className="p-3">
        <Button
          asChild
          className={cn(
            'w-full gap-2',
            isCollapsed ? 'px-2' : 'px-4'
          )}
          variant="outline"
        >
          <Link href="/teams/new">
            <Plus className="h-4 w-4 flex-shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap"
                >
                  새 팀 만들기
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </Button>
      </div>

      {/* 접기/펼치기 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          'absolute -right-3 top-20 h-6 w-6 rounded-full border border-slate-200 bg-white shadow-sm',
          'hover:bg-slate-50'
        )}
        aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
    </motion.aside>
  );
}
