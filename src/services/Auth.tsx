import { createContext, useContext, useState, useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { account, databases, databaseId, userCollectionId } from './node_appwrite';
import { AppwriteException, Models, Query } from 'appwrite';
import { SessionManager, Session } from './SessionManager';

// Define user type from Users collection
interface UserData {
  $id: string;
  email: string;
  name: string;
  password: string;
  created_at: string;
}

// Define types
interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, redirectPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  isAuthenticated: boolean;
  sessionCheckedAt: number;
}

// Create context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  login: async () => {},
  logout: async () => {},
  checkSession: async () => {},
  isAuthenticated: false,
  sessionCheckedAt: 0,
});

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Session check interval (5 minutes)
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000;

// Auth provider component
export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [sessionCheckedAt, setSessionCheckedAt] = useState<number>(0);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  // Check if user is logged in on mount
  useEffect(() => {
    checkSession();
    
    // Set up periodic session check
    const intervalId = setInterval(() => {
      // Only check if we have a session and last check was more than interval ago
      if (currentSession && Date.now() - sessionCheckedAt > SESSION_CHECK_INTERVAL) {
        checkSession();
      }
    }, SESSION_CHECK_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, []);

  // Login function using Users collection
  const login = async (email: string, password: string, redirectPath?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // First, query the Users collection to find the user with the provided email
      const response = await databases.listDocuments(
        databaseId,
        userCollectionId,
        [
          Query.equal('email', email)
        ]
      );
      
      if (response.documents.length === 0) {
        setError('Usuário não encontrado. Verifique suas credenciais.');
        return;
      }
      
      const userData = response.documents[0] as unknown as UserData;
      
      // In a real app, we would verify the password hash here
      // For now, we're just checking if the password matches (UNSAFE, just for demo)
      // In production, you should use proper password hashing and verification
      
      // This is a simplified check - in a real app, you would compare password hashes
      if (password !== userData.password) {
        setError('Senha inválida. Tente novamente.');
        return;
      }
      
      // Create a new session for this user
      const session = await SessionManager.createSession(userData.$id);
      
      if (!session) {
        setError('Falha ao criar sessão. Tente novamente.');
        return;
      }
      
      // Store user data and session in state
      setUser(userData);
      setIsAuthenticated(true);
      setCurrentSession(session);
      setSessionCheckedAt(Date.now());
      
      // Redirect after login if path is provided
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // If we have a session, deactivate it
      if (currentSession) {
        await SessionManager.deactivateSession(currentSession.$id);
      } else {
        // If no session in state, try to get current session
        const session = await SessionManager.getCurrentSession();
        if (session) {
          await SessionManager.deactivateSession(session.$id);
        }
      }
      
      // Clear user data
      setUser(null);
      setIsAuthenticated(false);
      setCurrentSession(null);
      setSessionCheckedAt(Date.now());
      
      // Redirect to login
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Force clear session if logout fails
      localStorage.removeItem('sessionToken');
      setUser(null);
      setIsAuthenticated(false);
      setCurrentSession(null);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  // Check session function
  const checkSession = async () => {
    try {
      // If we checked recently, don't check again
      const now = Date.now();
      if (now - sessionCheckedAt < 10000) { // Don't check more than once every 10 seconds
        return;
      }
      
      setLoading(true);
      
      // Get current session
      const session = await SessionManager.getCurrentSession();
      setCurrentSession(session);
      setSessionCheckedAt(now);
      
      if (!session) {
        // No valid session found
        setUser(null);
        setIsAuthenticated(false);
        return;
      }
      
      // Fetch user data from Users collection using the session's userId
      try {
        const userData = await databases.getDocument(
          databaseId,
          userCollectionId,
          session.userId
        ) as unknown as UserData;
        
        setUser(userData);
        setIsAuthenticated(true);
      } catch (err) {
        // Error fetching user or user not found
        console.error('Error fetching user data:', err);
        setUser(null);
        setIsAuthenticated(false);
        
        // Deactivate invalid session
        await SessionManager.deactivateSession(session.$id);
        setCurrentSession(null);
      }
    } catch (err) {
      // Error checking session
      console.error('Session check error:', err);
      setUser(null);
      setIsAuthenticated(false);
      setCurrentSession(null);
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    checkSession,
    isAuthenticated,
    sessionCheckedAt,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
