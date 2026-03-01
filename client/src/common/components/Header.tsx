import { Music, Library, Settings } from 'lucide-react';
import { Button } from '@common/components/ui/button';
import { useAuth, LoginButton, UserMenu } from '@features/auth';

interface HeaderProps {
  onLibraryClick: () => void;
  onSettingsClick: () => void;
}

export default function Header({ onLibraryClick, onSettingsClick }: HeaderProps) {
  const { user, isLoading, login, logout } = useAuth();

  return (
    <header className="h-16 backdrop-blur-md bg-card/50 border-b border-border px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Music className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Hog The Mic
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onLibraryClick}
          data-testid="button-library"
        >
          <Library className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          data-testid="button-settings"
        >
          <Settings className="w-5 h-5" />
        </Button>

        {!isLoading && (
          <>
            {user ? (
              <UserMenu user={user} onLogout={logout} />
            ) : (
              <LoginButton onLogin={login} />
            )}
          </>
        )}
      </div>
    </header>
  );
}
