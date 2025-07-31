import React, { useContext } from 'react'
import { Link, useLocation } from 'react-router'
import logo from '../assets/oas_logo_1.png'
import authContext from '../context/auth/authContext'

function Navbar() {
    const location = useLocation();
    const { loggedIn, userType } = useContext(authContext);

    const isUser = userType === "User";

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark py-3 ">
            <div className="container-fluid px-5">
                <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
                    <img id="main-logo" height="60px" className="mr-3" src={logo} alt="logo" />
                    <span>Office Automation System</span>
                </Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>

                {loggedIn && (
                    <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
                        <ul className="navbar-nav">
                            <li className="nav-item">
                                <Link className={`nav-link ${location.pathname === "/" ? "active" : ""}`} to="/">Home</Link>
                            </li>
                            <li className="nav-item">
                                <Link className={`nav-link ${location.pathname === "/notices" ? "active" : ""}`} to="/notices">Notices</Link>
                            </li>
                            {!isUser &&
                            <li className="nav-item">
                                <Link className={`nav-link ${location.pathname === "/assigned-tasks" ? "active" : ""}`} to="/assigned-tasks">Assigned Tasks</Link>
                            </li>}
                            {!isUser &&
                            <li className="nav-item">
                                <Link className={`nav-link ${location.pathname === "/tasks" ? "active" : ""}`} to="/tasks">Tasks</Link>
                            </li>}
                            
                            <li className="nav-item">
                                <Link className={`nav-link ${location.pathname === "/projects" ? "active" : ""}`} to="/projects">Projects</Link>
                            </li>
                            <li className="nav-item">
                                <Link className={`nav-link ${location.pathname === "/documents" ? "active" : ""}`} to="/documents">Documents</Link>
                            </li>
                            {!isUser &&
                            <li className="nav-item">
                                <Link className={`nav-link ${location.pathname === "/reports" ? "active" : ""}`} to="/reports">Reports</Link>
                            </li>}
                            {!isUser &&
                                <li className="nav-item">
                                    <Link className={`nav-link ${location.pathname === "/users" ? "active" : ""}`} to="/users">Users</Link>
                                </li>
                            }
                            
                            {isUser &&
                            <li className="nav-item">
                                <Link className={`nav-link ${location.pathname === "/my-tasks" ? "active" : ""}`} to="/my-tasks">My Tasks</Link>
                            </li>
                            }
                        </ul>
                    </div>
                )}
            </div>
        </nav>
    )
}

export default Navbar