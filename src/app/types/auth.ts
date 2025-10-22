// Type definitions for the authentication and user system

export interface ZodiacChart {
  sun: string;
  moon: string;
  rising: string;
  birthInfo: {
    date: string;
    time: string;
    location: string;
  };
}

export interface User {
  username: string;
  password: string;
  zodiacChart: ZodiacChart;
  createdAt: string;
  isGuest?: boolean;
}

export interface AuthData {
  username: string;
  password: string;
  isLogin: boolean;
  isGuest?: boolean;
  rememberMe?: boolean;
  birthDate?: string;
  birthTime?: string;
  birthLocation?: string;
}

export interface AuthFormProps {
  onAuth: (authData: AuthData) => void;
  onCancel: () => void;
  existingUser?: User | null;
}

export interface UserProfileProps {
  userProfile: User | null;
  onEdit: () => void;
  onClose: () => void;
}

export interface SidebarProps {
  active: string;
  setActive: (active: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
  onProfileOpen?: () => void;
}

export interface MainContentProps {
  active: string;
  user?: User | null;
  onLogin?: () => void;
}
