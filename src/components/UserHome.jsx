import React, { useEffect, useState, useContext } from 'react'
import authContext from '../context/auth/authContext'
import alertContext from '../context/alert/alertContext'
import NotAuthorized from './NotAuthorized'
import Loading from './Loading'
import Alert from './Alert'

const UserHome = () => {
    const { authToken, user, loggedIn } = useContext(authContext)
    const { showAlert } = useContext(alertContext)
    const [loading, setLoading] = useState(true);
    const [totalAssignedTasks, setTotalAssignedTasks] = useState(null);
    const [completedTasks, setCompletedTasks] = useState(null);
    const [inProgressTasks, setInProgressTasks] = useState(null);
    const [pendingTasks, setPendingTasks] = useState(null);
    const [overdueTasks, setOverdueTasks] = useState(null);
    const [localUser, setLocalUser] = useState(null);

    // State for project counts based on bill image
    const [completedProjectsCount, setCompletedProjectsCount] = useState(0);
    const [pendingProjectsCount, setPendingProjectsCount] = useState(0);

    // Fetch user data when component mounts
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                if (!authToken) return;

                const response = await fetch('http://localhost:5000/api/auth/getuser', {
                    method: 'POST',
                    headers: {
                        'auth-token': authToken,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(errorData?.error || 'Failed to fetch user data');
                }

                const userData = await response.json();
                if (!userData || !userData._id) {
                    throw new Error('Invalid user data received');
                }
                setLocalUser(userData);
            } catch (error) {
                showAlert(error.message, 'danger');
            }
        };

        if (loggedIn && authToken && !localUser) {
            fetchUserData();
        }
    }, [authToken, loggedIn, localUser, showAlert]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                if (!authToken) {
                    setError('Authentication token not found')
                    setLoading(false)
                    showAlert('Please login to view your tasks', 'error')
                    return
                }

                const response = await fetch(`http://localhost:5000/api/task/my-tasks`, {
                    method: 'GET',
                    headers: {
                        'auth-token': authToken,
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Session expired. Please login again.')
                    }
                    throw new Error('Failed to fetch tasks')
                }

                const data = await response.json()
                
                setTotalAssignedTasks(data.length);
                let total_assigned_overdue_tasks = 0;
                let total_assigned_pending_tasks = 0;
                let total_assigned_in_progress_tasks = 0;
                let total_assigned_completed_tasks = 0;
            
                data.forEach(task => {
                    if (task.status === "Pending") {
                        total_assigned_pending_tasks++;
                    }
                    else if (task.status === "In Progress") {
                        total_assigned_in_progress_tasks++;
                    }
                    else if (task.status === "Overdue") {
                        total_assigned_overdue_tasks++;
                    }
                    else if (task.status === "Completed") {
                        total_assigned_completed_tasks++;
                    }
                });

                setCompletedTasks(total_assigned_completed_tasks);
                setInProgressTasks(total_assigned_in_progress_tasks);
                setPendingTasks(total_assigned_pending_tasks);
                setOverdueTasks(total_assigned_overdue_tasks);

            } catch (error) {
                showAlert(error.message, 'danger')
            } finally {
                setLoading(false)
            }
        }

        if (loggedIn && authToken) {
            fetchTasks()
        }
    }, [authToken, loggedIn, showAlert])

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                if (!authToken || !localUser?._id) {
                    return;
                }

                const response = await fetch('http://localhost:5000/api/projects/getprojects', {
                    headers: {
                        'auth-token': authToken
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
                }

                const projectsData = await response.json();

                // Calculate completed and pending projects based on billImage
                const completed = projectsData.filter(project => project.billImage && project.billImage.fileName).length;
                const pending = projectsData.filter(project => !project.billImage || !project.billImage.fileName).length;
                
                setCompletedProjectsCount(completed);
                setPendingProjectsCount(pending);

            } catch (error) {
                showAlert(error.message || 'Error fetching project data', 'danger');
            }
        };

        if (loggedIn && authToken && localUser?._id) {
            fetchProjects();
        }
    }, [authToken, loggedIn, localUser?._id, showAlert]);

    return (
        <div>
            {loggedIn ? (
                <div>
                    <div className="mb-4">
                        <h3 className="text-center mb-3">My Tasks</h3>
                        <div className="row text-center">
                            <div className="col">
                                <div className="card bg-primary p-2">
                                    <div className="card-title text-white fw-bold fs-5">{totalAssignedTasks} <br />Total Tasks</div>
                                </div>
                            </div>
                            <div className="col">
                                <div className="card bg-success p-2">
                                    <div className="card-title text-white fw-bold fs-5">{completedTasks} <br />Completed Tasks</div>
                                </div>
                            </div>
                            <div className="col">
                                <div className="card bg-info p-2">
                                    <div className="card-title text-white fw-bold fs-5">{inProgressTasks} <br />In Progress Tasks</div>
                                </div>
                            </div>
                            <div className="col">
                                <div className="card bg-warning p-2">
                                    <div className="card-title text-white fw-bold fs-5">{pendingTasks} <br />Pending Tasks</div>
                                </div>
                            </div>
                            <div className="col">
                                <div className="card bg-danger p-2">
                                    <div className="card-title text-white fw-bold fs-5">{overdueTasks} <br />Overdue Tasks</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6">
                            <div className="homepage-completed-project-block card text-center p-2 mb-3">
                                <div className="card-title text-white fw-bold fs-5">Completed Projects : {completedProjectsCount}</div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="homepage-pending-project-block card text-center p-2">
                                <div className="card-title text-white fw-bold fs-5">Pending Projects : {pendingProjectsCount}</div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <NotAuthorized />
            )}
        </div>
    )
}

export default UserHome;
