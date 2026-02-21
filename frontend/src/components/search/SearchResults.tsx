"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";

interface Team {
  id: string;
  name: string;
  description: string | null;
}

interface Task {
  id: string;
  type: string;
  team_name: string;
}

interface SearchResultsProps {
  query: string;
  onClose: () => void;
}

export function SearchResults({ query, onClose }: SearchResultsProps) {
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 300);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setTeams([]);
      setTasks([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Fetch teams
        const teamsRes = await fetch(
          `/api/v1/teams?search=${encodeURIComponent(debouncedQuery)}`,
          { headers }
        );
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData.teams.slice(0, 5)); // Limit to 5 results
        }

        // Fetch tasks
        const tasksRes = await fetch(
          `/api/v1/tasks?search=${encodeURIComponent(debouncedQuery)}`,
          { headers }
        );
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(tasksData.tasks.slice(0, 5)); // Limit to 5 results
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  if (!query.trim()) {
    return null;
  }

  const hasResults = teams.length > 0 || tasks.length > 0;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-lg overflow-hidden z-50">
      {loading ? (
        <div className="p-4 text-center">
          <p className="font-bold">검색 중...</p>
        </div>
      ) : hasResults ? (
        <div className="max-h-96 overflow-y-auto">
          {teams.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">
                팀
              </div>
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => {
                    router.push(`/teams/${team.id}`);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-yellow-300 transition-colors border-b-2 border-black/10 last:border-b-0"
                >
                  <div className="font-bold">{team.name}</div>
                  {team.description && (
                    <div className="text-sm text-gray-600 truncate">
                      {team.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {tasks.length > 0 && (
            <div className="p-2 border-t-[3px] border-black">
              <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">
                작업
              </div>
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    router.push(`/tasks/${task.id}`);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-blue-300 transition-colors border-b-2 border-black/10 last:border-b-0"
                >
                  <div className="font-bold">{task.type}</div>
                  <div className="text-sm text-gray-600">{task.team_name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-center">
          <p className="font-bold text-gray-500">검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  );
}
