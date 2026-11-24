import { AuthContext, useAuthState } from '../hooks/useAuth.js';

function AuthProvider({ children }) {
  const auth = useAuthState();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;