// Home.jsx (refactored)
import React, { useContext } from 'react';
import Login from './Login';
import ManagerHome from './ManagerHome';
import UserHome from './UserHome';
import authContext from '../context/auth/authContext';

function Home() {
  const { loggedIn, userType } = useContext(authContext);

  return (
    <div className="container my-3">
      {!loggedIn ? (
        <div className="row">
          <div className="col-9">
            <div id="swot-wrapper" className="text-center">
              <img src="src\assets\swot.png" alt="swot" width="100%" />
            </div>
          </div>
          <div className="col">
            <Login />
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col">
            {userType === 'Manager' ? <ManagerHome /> : <UserHome />}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;