import { LogIn } from 'lucide-react';
import { Button } from '@common/components/ui/button';

interface LoginButtonProps {
  onLogin: () => void;
}

export default function LoginButton({ onLogin }: LoginButtonProps) {
  return (
    <Button
      onClick={onLogin}
      variant="default"
      size="sm"
      className="gap-2"
      data-testid="button-login"
    >
      <LogIn className="w-4 h-4" />
      Log In
    </Button>
  );
}
