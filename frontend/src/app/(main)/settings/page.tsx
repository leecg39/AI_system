"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { SettingsSkeleton } from "@/components/skeletons/SettingsSkeleton";
import { listTasks } from "@/services/tasks";
import { getCurrentUserProfile, updateCurrentUserProfile, getUserPreferences, updateUserPreferences } from "@/services/users";
import type { UserProfile } from "@/types/user";

interface NotificationSettings {
  taskCompleted: boolean;
  errorAlert: boolean;
  weeklyReport: boolean;
}

const API_KEY_STORAGE_KEY = "clabs.settings.apiKey";

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  taskCompleted: true,
  errorAlert: true,
  weeklyReport: false,
};

function planLabel(plan: string): string {
  if (plan === "enterprise") {
    return "Enterprise";
  }
  if (plan === "pro") {
    return "Pro";
  }
  return "Free";
}

function maskApiKey(raw: string): string {
  if (raw.length <= 8) {
    return "*".repeat(raw.length);
  }
  return `${raw.slice(0, 4)}${"*".repeat(raw.length - 8)}${raw.slice(-4)}`;
}

function toJsonString(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyMasked, setApiKeyMasked] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [apiKeyNotice, setApiKeyNotice] = useState<string | null>(null);
  const [notificationNotice, setNotificationNotice] = useState<string | null>(null);
  const [dataNotice, setDataNotice] = useState<string | null>(null);

  const notificationSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedApiKey = window.localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedApiKey && savedApiKey.length > 0) {
      setApiKeyMasked(maskApiKey(savedApiKey));
    }
  }, []);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [profile, prefs] = await Promise.all([
        getCurrentUserProfile(),
        getUserPreferences()
      ]);

      setUser(profile);
      setNameInput(profile.name ?? "");

      // Load server preferences
      setNotifications({
        taskCompleted: prefs.notifications.task_completed,
        errorAlert: prefs.notifications.task_failed,
        weeklyReport: false, // Not yet in backend
      });
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "설정 정보를 불러오지 못했습니다.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const planBadgeClassName = useMemo(() => {
    if (user?.plan === "enterprise") {
      return "border-accent bg-secondary text-accent";
    }
    if (user?.plan === "pro") {
      return "border-accent bg-secondary text-accent";
    }
    return "border-foreground bg-secondary text-foreground";
  }, [user?.plan]);

  const handleSaveProfile = async () => {
    if (!user) {
      return;
    }

    const trimmedName = nameInput.trim();
    if (trimmedName.length === 0) {
      setProfileNotice("이름을 입력해 주세요.");
      return;
    }

    setIsSavingProfile(true);
    setProfileNotice(null);
    setError(null);

    try {
      const updated = await updateCurrentUserProfile({ name: trimmedName });
      setUser(updated);
      setNameInput(updated.name);
      setProfileNotice("프로필이 저장되었습니다.");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "프로필 저장에 실패했습니다.";
      setProfileNotice(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveApiKey = () => {
    if (typeof window === "undefined") {
      return;
    }

    const trimmed = apiKeyInput.trim();
    if (trimmed.length < 12) {
      setApiKeyNotice("API 키 형식을 확인해 주세요.");
      return;
    }

    setIsSavingApiKey(true);
    setApiKeyNotice(null);

    try {
      window.localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
      setApiKeyMasked(maskApiKey(trimmed));
      setApiKeyInput("");
      setApiKeyNotice("API 키가 마스킹되어 저장되었습니다.");
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    setNotificationNotice(null);

    try {
      await updateUserPreferences({
        notifications: {
          task_completed: notifications.taskCompleted,
          task_failed: notifications.errorAlert,
        }
      });
      setNotificationNotice("알림 설정이 저장되었습니다.");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "알림 설정 저장에 실패했습니다.";
      setNotificationNotice(message);
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // Auto-save notifications with debounce
  useEffect(() => {
    if (isLoading) {
      return; // Skip during initial load
    }

    // Clear previous timeout
    if (notificationSaveTimeoutRef.current) {
      clearTimeout(notificationSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    notificationSaveTimeoutRef.current = setTimeout(() => {
      void updateUserPreferences({
        notifications: {
          task_completed: notifications.taskCompleted,
          task_failed: notifications.errorAlert,
        }
      }).catch((err) => {
        console.error("Auto-save preferences failed:", err);
      });
    }, 500);

    return () => {
      if (notificationSaveTimeoutRef.current) {
        clearTimeout(notificationSaveTimeoutRef.current);
      }
    };
  }, [notifications.taskCompleted, notifications.errorAlert, isLoading]);

  const handleExportHistory = async () => {
    if (typeof window === "undefined") {
      return;
    }

    setIsExporting(true);
    setDataNotice(null);
    setError(null);

    try {
      const response = await listTasks({ page: 1, limit: 100 });
      const payload = {
        exported_at: new Date().toISOString(),
        total: response.total,
        tasks: response.tasks,
      };

      const blob = new Blob([toJsonString(payload)], {
        type: "application/json;charset=utf-8",
      });
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `task-history-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);

      setDataNotice("작업 이력을 JSON 파일로 내보냈습니다.");
    } catch (exportError) {
      const message = exportError instanceof Error ? exportError.message : "작업 이력 내보내기에 실패했습니다.";
      setDataNotice(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteHistory = () => {
    if (typeof window === "undefined") {
      return;
    }

    setIsDeleting(true);
    setDataNotice(null);

    try {
      const confirmed = window.confirm("작업 이력 관련 로컬 캐시를 삭제할까요?");
      if (!confirmed) {
        setDataNotice("삭제를 취소했습니다.");
        return;
      }

      window.localStorage.removeItem("clabs.settings.history.cache");
      setDataNotice("로컬 이력 캐시를 삭제했습니다. 서버 이력 삭제 API는 추후 연동됩니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (!user) {
    return (
      <div className="space-y-4 py-8" data-testid="settings-error">
        <h1 className="text-3xl font-black text-foreground">설정</h1>
        <div className="border-[3px] border-red-500 bg-red-50 p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <p className="font-bold text-red-700">설정 정보를 불러오지 못했습니다.</p>
          <p className="text-sm text-red-700">{error ?? "잠시 후 다시 시도해 주세요."}</p>
        </div>
        <Button type="button" onClick={() => void loadProfile()}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4" data-testid="settings-page">
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-foreground">설정</h1>
        <p className="text-muted-foreground">프로필, API 키, 구독, 알림, 데이터 관리 설정을 조정합니다.</p>
      </header>

      {error ? <div className="border-[3px] border-red-500 bg-red-50 p-3 text-sm font-bold text-red-700 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">{error}</div> : null}

      <section className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]" data-testid="profile-section">
        <h2 className="text-lg font-black text-foreground">프로필</h2>
        <p className="mt-1 text-sm text-muted-foreground">이름과 계정 정보를 확인하고 프로필을 수정합니다.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-bold text-foreground">이름</span>
            <input
              type="text"
              className="w-full border-[2px] border-foreground px-3 py-2 font-medium"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-bold text-foreground">이메일</span>
            <input
              type="email"
              className="w-full border-[2px] border-foreground bg-slate-50 px-3 py-2 font-medium text-slate-500"
              value={user.email}
              readOnly
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={() => void handleSaveProfile()} disabled={isSavingProfile}>
            {isSavingProfile ? "저장 중..." : "프로필 저장"}
          </Button>
        </div>

        {profileNotice ? (
          <p className="mt-3 border-[2px] border-blue-500 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{profileNotice}</p>
        ) : null}
      </section>

      <section className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]" data-testid="api-key-section">
        <h2 className="text-lg font-black text-foreground">API 키</h2>
        <p className="mt-1 text-sm text-muted-foreground">OpenAI API 키를 마스킹 형태로 저장합니다.</p>

        <label className="mt-4 block space-y-1 text-sm">
          <span className="font-bold text-foreground">OpenAI API Key</span>
          <input
            type="password"
            className="w-full border-[2px] border-foreground px-3 py-2 font-medium"
            placeholder="sk-ant-..."
            value={apiKeyInput}
            onChange={(event) => setApiKeyInput(event.target.value)}
          />
        </label>

        <p className="mt-2 text-xs text-muted-foreground">저장된 키: {apiKeyMasked ?? "없음"}</p>

        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={handleSaveApiKey} disabled={isSavingApiKey} className="border-[2px] border-foreground font-bold shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
            {isSavingApiKey ? "저장 중..." : "API 키 저장"}
          </Button>
        </div>

        {apiKeyNotice ? (
          <p className="mt-3 border-[2px] border-blue-500 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{apiKeyNotice}</p>
        ) : null}
      </section>

      <section className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]" data-testid="subscription-section">
        <h2 className="text-lg font-black text-foreground">구독 플랜</h2>
        <p className="mt-1 text-sm text-muted-foreground">현재 플랜과 API 사용량을 확인합니다.</p>

        <dl className="mt-4 grid gap-2 text-sm text-foreground">
          <div className="flex justify-between gap-3 border-b-[2px] border-dashed border-foreground/20 pb-2">
            <dt className="font-bold">플랜</dt>
            <dd>
              <span className={`inline-flex border-[2px] px-2 py-1 text-xs font-bold ${planBadgeClassName}`}>
                {planLabel(user.plan)}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-b-[2px] border-dashed border-foreground/20 pb-2">
            <dt className="font-bold">API 사용량</dt>
            <dd>{user.api_usage_count.toLocaleString()} 회</dd>
          </div>
          <div className="flex justify-between gap-3 border-b-[2px] border-dashed border-foreground/20 pb-2">
            <dt className="font-bold">가입일</dt>
            <dd>{new Date(user.created_at).toLocaleDateString("ko-KR")}</dd>
          </div>
        </dl>
      </section>

      <section className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]" data-testid="notification-section">
        <h2 className="text-lg font-black text-foreground">알림 설정</h2>
        <p className="mt-1 text-sm text-muted-foreground">작업 완료/오류/주간 리포트 알림 여부를 설정합니다.</p>

        <div className="mt-4 space-y-3 text-sm">
          <label className="flex items-center justify-between gap-3">
            <span className="font-bold">작업 완료 알림</span>
            <input
              type="checkbox"
              checked={notifications.taskCompleted}
              onChange={(event) =>
                setNotifications((current) => ({
                  ...current,
                  taskCompleted: event.target.checked,
                }))
              }
            />
          </label>

          <label className="flex items-center justify-between gap-3">
            <span className="font-bold">오류 발생 알림</span>
            <input
              type="checkbox"
              checked={notifications.errorAlert}
              onChange={(event) =>
                setNotifications((current) => ({
                  ...current,
                  errorAlert: event.target.checked,
                }))
              }
            />
          </label>

          <label className="flex items-center justify-between gap-3">
            <span className="font-bold">주간 리포트 알림</span>
            <input
              type="checkbox"
              checked={notifications.weeklyReport}
              onChange={(event) =>
                setNotifications((current) => ({
                  ...current,
                  weeklyReport: event.target.checked,
                }))
              }
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={handleSaveNotifications} disabled={isSavingNotifications} className="border-[2px] border-foreground font-bold shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
            {isSavingNotifications ? "저장 중..." : "알림 설정 저장"}
          </Button>
        </div>

        {notificationNotice ? (
          <p className="mt-3 border-[2px] border-blue-500 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{notificationNotice}</p>
        ) : null}
      </section>

      <section className="border-[3px] border-foreground bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]" data-testid="data-management-section">
        <h2 className="text-lg font-black text-foreground">데이터 관리</h2>
        <p className="mt-1 text-sm text-muted-foreground">작업 이력 내보내기 및 정리 기능을 제공합니다.</p>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => void handleExportHistory()} disabled={isExporting} className="border-[2px] border-foreground font-bold shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
            {isExporting ? "내보내는 중..." : "작업 이력 내보내기"}
          </Button>
          <Button type="button" variant="outline" onClick={handleDeleteHistory} disabled={isDeleting} className="border-[2px] border-foreground font-bold shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
            {isDeleting ? "삭제 중..." : "작업 이력 삭제"}
          </Button>
        </div>

        {dataNotice ? (
          <p className="mt-3 border-[2px] border-blue-500 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{dataNotice}</p>
        ) : null}
      </section>
    </div>
  );
}
