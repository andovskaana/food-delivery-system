import React, {useEffect, useState} from 'react';
import AuthContext from "../contexts/authContext.js";

const decode = (token) => {
  try { return JSON.parse(atob(token.split(".")[1])); }
  catch { return null; }
};

// Turn ["ROLE_CUSTOMER","ROLE_OWNER"] into ["CUSTOMER","OWNER"]
const normalizeRoles = (roles) =>
    (roles || []).map(r => (r ?? "").replace(/^ROLE_/, ""));

const AuthProvider = ({children}) => {
  const [state, setState] = useState({ user: null, isLoading: true });

  const login = (token) => {
    localStorage.setItem("token", token);
    const decoded = decode(token);
    const roles = normalizeRoles(decoded?.roles || decoded?.authorities || []);
    setState({
      user: { username: decoded?.sub, roles },
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setState({ user: null, isLoading: false });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // try to restore session without forcing a re-login
      login(token);
    } else {
      setState({ user: null, isLoading: false });
    }
  }, []);

  return (
      <AuthContext.Provider value={{ ...state, login, logout, isLoggedIn: !!state.user }}>
        {children}
      </AuthContext.Provider>
  );
};

export default AuthProvider;