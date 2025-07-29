import React from 'react'
import NotAuthorized from './NotAuthorized';
import ManagerReports from './ManagerReports';
import UserReports from './UserReports';
import authContext from '../context/auth/authContext';
import alertContext from '../context/alert/alertContext';
import { useState, useContext, useEffect } from 'react';
import Loading from './Loading';


function Reports() {
  
  const { loggedIn, userType, authToken, user } = useContext(authContext);
  const { showAlert } = useContext(alertContext);

  return (
    <div className="container my-3">
      {loggedIn ? (
        <div>
          <h2>Reports</h2>

          {userType === "Manager" && (
            <ManagerReports />
          )}

          {userType === "User" && (
            <UserReports/>
          )}
        </div>
      ) : (<NotAuthorized />)}
    </div>
  )
}

export default Reports
