import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router';
import authContext from '../context/auth/authContext';
import alertContext from '../context/alert/alertContext';
import { useNavigate } from 'react-router';
import Loading from './Loading';

function GetUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { authToken, loggedIn, logout } = useContext(authContext);
  const { showAlert } = useContext(alertContext);
  const navigate = useNavigate();

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/auth/getuser", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': authToken
        }
      });

      const userData = await response.json();
      console.log(userData);
      
      if (userData) {
        setUser(userData);
      } else {
        showAlert("Failed to fetch user data", "danger");
        // Handle token expiration if needed
        // if (userData.error === "Token expired" || userData.error === "Invalid token") {
        //   logout();
        // }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      showAlert("Server error while fetching user data", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedIn && authToken) {
      fetchUserData();
    }
  }, [loggedIn, authToken]);

  const handleLogout = () => {
    logout();
    showAlert("Logged out successfully", "success");
    navigate("/");
  };

  if (loading) {
    return <div>Loading user data...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="user-info-bar">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          Welcome, <strong>{user.name}</strong> | Role: <span className="badge bg-info">{user.type}</span>
        </div>
        <div>
          <Link to="/profile" className="btn btn-sm btn-outline-primary mx-2">Profile</Link>
          <button onClick={handleLogout} className="btn btn-sm btn-outline-danger">Logout</button>
        </div>
      </div>
    </div>
  );
}

export default GetUser;