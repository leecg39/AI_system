import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CreateTeamButtonProps {
  emphasized?: boolean;
}

export function CreateTeamButton({ emphasized = false }: CreateTeamButtonProps) {
  return (
    <Button
      asChild
      className={emphasized ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
      variant={emphasized ? "default" : "outline"}
    >
      <Link href="/teams/new">새 팀 만들기</Link>
    </Button>
  );
}
