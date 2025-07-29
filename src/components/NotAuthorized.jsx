import React from 'react'

function NotAuthorized() {
    const isLoggedIn = localStorage.getItem("authToken") !== null;
    return (

            <div className="alert alert-danger" role="alert">
                <h4 className="alert-heading">Not Found!</h4>
                <p>You are not Authorized to access this page.</p>
                <hr />
            </div>

    )
}

export default NotAuthorized
