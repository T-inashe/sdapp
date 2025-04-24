//AuthContext.tsx
import { createContext } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  institution?: string;
  avatar?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
});

export default AuthContext;