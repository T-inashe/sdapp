import { createContext } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role?:string;
  institution?: string;
  avatar?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {}, // dummy default
  logout: () => {}, // dummy default
});

export default AuthContext;
