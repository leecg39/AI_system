// @TASK P1-S0-T1 - 공통 대시보드 레이아웃: Mobile Sidebar
// @SPEC docs/planning/03-user-flow.md#대시보드

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  History,
  Settings,
  Plus,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    href: '/tasks/history',
    icon: History,
  },
  {
    label: '설정',
    href: '/settings',
    icon: Settings,
  },
];

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="h-16 flex items-center justify-center border-b border-neo border-foreground px-4">
          <SheetTitle className="text-xl font-bold text-accent">
            AI System
          </SheetTitle>
        </SheetHeader>

        {/* 네비게이션 */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 transition-colors border border-transparent',
                  'hover:bg-secondary hover:border-foreground',
                  isActive
                    ? 'bg-secondary border-foreground text-accent font-bold'
                    : 'text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-accent' : 'text-muted-foreground'
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* 하단 액션 */}
        <div className="p-3">
          <Button
            asChild
            className="w-full gap-2"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            <Link href="/teams/new">
              <Plus className="h-4 w-4" />
              <span>새 팀 만들기</span>
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
