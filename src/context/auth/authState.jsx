// context/auth/authState.js
import React, { useState, useEffect } from 'react';
import authContext from "./authContext";

const AuthState = (props) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [userType, setUserType] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUserType = localStorage.getItem("userType");
    if (storedToken) {
      setAuthToken(storedToken);
      setUserType(storedUserType);
      setLoggedIn(true);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const json = await response.json();
      
      if (json.success === true) {
        localStorage.setItem('authToken', json.authToken);
        localStorage.setItem('userType', json.userType);
        setAuthToken(json.authToken);
        setUserType(json.userType);
        setLoggedIn(true);
        setUser(json.user);
        return { success: true };
      } else {
        return { success: false, error: json.error || "Login failed" };
      }
    } catch (error) {
      return { success: false, error: "Server error" };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    setAuthToken(null);
    setUserType(null);
    setLoggedIn(false);
    setUser(null);
  };

  return (
    <authContext.Provider
      value={{
        loggedIn,
        authToken,
        userType,
        user,
        login,
        logout
      }}
    >
      {props.children}
    </authContext.Provider>
  );
};

export default AuthState;