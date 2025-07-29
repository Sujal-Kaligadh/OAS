
import React from 'react'
import NotAuthorized from './NotAuthorized';
import ManagerReports from './ManagerReports';
import authContext from '../context/auth/authContext';
import alertContext from '../context/alert/alertContext';
import { useState, useContext, useEffect } from 'react';
import Loading from './Loading';

export default function UserReports() {

    const { loggedIn, userType, authToken, user } = useContext(authContext);
    const { showAlert } = useContext(alertContext);



    return (
        <div>
            {loggedIn ? (
                <div>
                    {userType === "User" && (
                        <div>
                            This is for users.
                        </div>
                    )}
                </div>
            ) : (<NotAuthorized />)}

        </div>
    )
}
