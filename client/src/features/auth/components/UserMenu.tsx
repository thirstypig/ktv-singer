import { LogOut } from 'lucide-react';
import { Button } from '@common/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@common/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@common/components/ui/avatar";
import type { User } from "@shared/schema";

interface UserMenuProps {
  user: User;
  onLogout: () => void;
}

function getUserInitials(firstName?: string | null, lastName?: string | null) {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) return firstName.substring(0, 2).toUpperCase();
  return 'U';
}

function getUserName(firstName?: string | null, lastName?: string | null) {
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (lastName) return lastName;
  return 'User';
}

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 h-9"
          data-testid="button-user-menu"
        >
          <Avatar className="w-7 h-7">
            <AvatarImage src={user.profileImageUrl || undefined} alt={getUserName(user.firstName, user.lastName)} />
            <AvatarFallback>{getUserInitials(user.firstName, user.lastName)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{getUserName(user.firstName, user.lastName)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{getUserName(user.firstName, user.lastName)}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} data-testid="button-logout">
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
