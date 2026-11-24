import { Button } from "@/core/components/shadcn/button";
import { LogIn, UserPlus } from "lucide-react";

interface PlacementClaimAuthActionsProps {
  onLogin: () => void;
  onRegister: () => void;
  claiming: boolean;
}

export default function PlacementClaimAuthActions({ onLogin, onRegister, claiming }: PlacementClaimAuthActionsProps) {
  return (
    <div className="mt-6 flex w-full flex-col gap-3">
      <Button
        type="button"
        size="lg"
        disabled={claiming}
        onClick={onLogin}
        className="w-full rounded-xl"
      >
        <LogIn className="size-4" aria-hidden="true" />
        Đăng nhập để xem kết quả
      </Button>
      <Button
        type="button"
        size="lg"
        variant="outline"
        disabled={claiming}
        onClick={onRegister}
        className="w-full rounded-xl"
      >
        <UserPlus className="size-4" aria-hidden="true" />
        Tạo tài khoản
      </Button>
    </div>
  );
}
