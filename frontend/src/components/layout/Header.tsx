// @TASK P1-S0-T1 - 공통 대시보드 레이아웃: Header
// @SPEC docs/planning/03-user-flow.md#대시보드

'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { SearchResults } from '@/components/search/SearchResults';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Get user initials for avatar
  const getUserInitial = () => {
    if (!user?.name) return null;
    return user.name.charAt(0).toUpperCase();
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show results when typing
  useEffect(() => {
    if (searchQuery.trim()) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [searchQuery]);

  return (
    <header className="h-16 border-b border-neo border-foreground bg-card shadow-neo-light">
      <div className="flex h-full items-center gap-4 px-4 lg:px-6">
        {/* 모바일 메뉴 토글 */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* 검색 */}
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="검색..."
            className="pl-9 bg-secondary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="검색"
          />
          {showResults && (
            <SearchResults
              query={searchQuery}
              onClose={() => {
                setShowResults(false);
                setSearchQuery('');
              }}
            />
          )}
        </div>

        {/* 오른쪽 영역 */}
        <div className="flex items-center gap-2">
          {/* 알림 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="알림"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-accent" />
          </Button>

          {/* 프로필 드롭다운 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10"
                aria-label="프로필 메뉴"
              >
                <Avatar>
                  <AvatarImage src="" alt={user?.name || '사용자'} />
                  <AvatarFallback className="bg-accent text-foreground font-bold">
                    {getUserInitial() || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {user ? (
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                ) : (
                  '내 계정'
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>내 정보</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>로그아웃</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
