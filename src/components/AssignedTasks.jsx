import React, { useEffect, useState } from 'react'
import { useContext } from 'react'
import authContext from '../context/auth/authContext'
import alertContext from '../context/alert/alertContext'
import NotAuthorized from './NotAuthorized'
import Loading from './Loading'
import AddBtn from './AddBtn'
import Alert from './Alert'
import { useNavigate } from 'react-router'

function AssignedTasks() {
    const { authToken, user, loggedIn, userType } = useContext(authContext)
    const { showAlert } = useContext(alertContext)
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeMessageId, setActiveMessageId] = useState(null)
    const [userNames, setUserNames] = useState({})
    const [filters, setFilters] = useState({
        message: '',
        status: '',
        priority: '',
        deadline: '',
        recipient: ''
    })
    const [usePriorityScheduling, setUsePriorityScheduling] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const handleBodyClick = (e) => {
            if (!e.target.closest('.message-text') && !e.target.closest('.message')) {
                const messageText = document.querySelector('.message-text:not(.d-none)');
                if (messageText) {
                    messageText.classList.add('d-none');
                    setActiveMessageId(null);
                }
            }
        };

        document.body.addEventListener('click', handleBodyClick);
        return () => {
            document.body.removeEventListener('click', handleBodyClick);
        };
    }, []);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                if (!authToken) {
                    setError('Authentication token not found')
                    setLoading(false)
                    showAlert('Please login to view assigned tasks', 'error')
                    return
                }

                const response = await fetch(`http://localhost:5000/api/task/assigned-tasks`, {
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
                    throw new Error('Failed to fetch assigned tasks')
                }

                const data = await response.json()
                setTasks(data)
                setError(null)

                // Fetch user names
                const uniqueUserIds = [...new Set([
                    ...data.map(task => task.recipient).filter(id => id)
                ])];
                const namesMap = {};

                for (const userId of uniqueUserIds) {
                    try {
                        const name = await getUserName(userId);
                        namesMap[userId] = name;
                    } catch (err) {
                        console.error(`Error fetching name for user ${userId}:`, err);
                        namesMap[userId] = "Unknown";
                    }
                }

                setUserNames(namesMap);
            } catch (error) {
                console.error('Error fetching assigned tasks:', error)
                setError(error.message)
                showAlert(error.message, 'danger')
            } finally {
                setLoading(false)
            }
        }

        if (loggedIn && authToken) {
            fetchTasks()
        }
    }, [authToken, loggedIn, showAlert])

    // Get the name of the user
    const getUserName = async (userId) => {
        if (!userId) return "None";
        try {
            const response = await fetch(`http://localhost:5000/api/auth/getuserbyid/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': authToken
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user');
            }

            const data = await response.json();
            return data.name;
        } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            return "Unknown";
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const priorityScheduling = (tasks) => {
        return [...tasks].sort((a, b) => {
            // Priority weights
            const priorityWeights = {
                'High': 100,
                'Medium': 50,
                'Low': 25
            };

            const statusWeights = {
                'Completed': 0,
                'Pending': 25,
                'In Progress': 50,
                'Overdue': 100
            }

            // Calculate days until deadline
            const now = new Date();
            const deadlineA = new Date(a.deadline);
            const deadlineB = new Date(b.deadline);

            // Calculate days remaining (negative for overdue tasks)
            const daysUntilA = Math.ceil((deadlineA - now) / (1000 * 60 * 60 * 24));
            const daysUntilB = Math.ceil((deadlineB - now) / (1000 * 60 * 60 * 24));

            // Always push completed tasks to the end
            if (a.status === "Completed" && b.status !== "Completed") return 1;
            if (b.status === "Completed" && a.status !== "Completed") return -1;

            // Base priority from task priority level
            let scoreA = priorityWeights[a.priority] + statusWeights[a.status];
            let scoreB = priorityWeights[b.priority] + statusWeights[b.status];

            // Deadline weight calculation
            // Tasks due sooner get higher priority
            const deadlineWeight = 10; // Weight factor for deadline
            scoreA += (30 - daysUntilA) * deadlineWeight;
            scoreB += (30 - daysUntilB) * deadlineWeight;

            // If priorities are the same, sort by deadline
            if (scoreA === scoreB) {
                return daysUntilA - daysUntilB;
            }

            return scoreB - scoreA; // Higher score comes first
        });
    };

    const filteredTasks = tasks.filter(task => {
        const messageMatch = task.message.toLowerCase().includes(filters.message.toLowerCase());
        const statusMatch = filters.status === '' || task.status === filters.status;
        const priorityMatch = filters.priority === '' || task.priority === filters.priority;
        const deadlineMatch = filters.deadline === '' || new Date(task.deadline).toISOString().split('T')[0] === filters.deadline;
        const recipientMatch = filters.recipient === '' || task.recipient === filters.recipient;

        return messageMatch && statusMatch && priorityMatch && deadlineMatch && recipientMatch;
    });

    const sortedTasks = usePriorityScheduling ? priorityScheduling(filteredTasks) : filteredTasks;

    const handleEdit = (taskId) => {
        navigate(`/node/edit/tasks/${taskId}`);
    };

    if (!loggedIn) {
        return <NotAuthorized />
    }

    if (userType === 'User') {
        return <NotAuthorized />
    }

    return (
        <div className="container my-3">
            <h2>My Assigned Tasks</h2>

            {userType !== 'User' && <AddBtn btntext="Task" link="/node/add/tasks" />}

            {error && (
                <Alert message={error} type="danger" />
            )}

            {loading ? (
                <Loading />
            ) : (
                <>
                    <div className="row mb-3">
                        <div className="col-md-2">
                            <select
                                className="form-control"
                                name="recipient"
                                value={filters.recipient}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Recipients</option>
                                {Object.entries(userNames).map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search message"
                                name="message"
                                value={filters.message}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div className="col-md-2">
                            <select
                                className="form-control"
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Overdue">Overdue</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <select
                                className="form-control"
                                name="priority"
                                value={filters.priority}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Priority</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <input
                                type="date"
                                className="form-control"
                                name="deadline"
                                value={filters.deadline}
                                onChange={handleFilterChange}
                            />
                        </div>

                    </div>
                    <div className="row mb-3">
                        <div className="col-md-3">
                            <div className="form-check form-switch">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="priorityScheduling"
                                    checked={usePriorityScheduling}
                                    onChange={(e) => setUsePriorityScheduling(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="priorityScheduling">
                                    Enable Priority Sorting
                                </label>
                            </div>
                        </div>
                    </div>

                    <p>Total Tasks: {sortedTasks.length}</p>
                    {sortedTasks.length === 0 ? (
                        <p className="text-center">No tasks found</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Task ID</th>
                                        <th>Recipient</th>
                                        <th>Task</th>
                                        <th>Deadline</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedTasks.map(task => (
                                        <tr key={task._id}>
                                            <td>{task.taskId}</td>
                                            <td>{userNames[task.recipient] || "Loading..."}</td>
                                            <td style={{ position: 'relative' }}>
                                                <div className={`message-text d-none`} style={{
                                                    position: 'absolute',
                                                    top: '5px',
                                                    left: '32px',
                                                    backgroundColor: 'white',
                                                    border: 'solid grey 1px',
                                                    borderRadius: '5px',
                                                    padding: '7px',
                                                    width: '300px',
                                                    zIndex: 2,
                                                    boxShadow: '0 0 6px 1px #4a4949',
                                                    wordWrap: 'break-word'
                                                }}>{task.message}</div>
                                                <span className="message" style={{
                                                    cursor: 'default'
                                                }} onClick={(e) => {
                                                    const messageText = e.currentTarget.previousElementSibling;
                                                    messageText.classList.toggle('d-none');
                                                    e.stopPropagation();
                                                }}>📝</span>

                                                {task.link && (
                                                    <span className="link" style={{
                                                        cursor: 'pointer'
                                                    }}
                                                        onClick={() => {
                                                            window.open(task.link, '_blank');
                                                        }}>🔗</span>
                                                )}

                                                {task.attachments && (
                                                    <span className="attachment" style={{
                                                        cursor: 'pointer'
                                                    }}
                                                        onClick={() => {
                                                            window.open(task.attachments, '_blank');
                                                        }}>📄</span>
                                                )}
                                            </td>
                                            <td>{new Date(task.deadline).toISOString().split('T')[0]}</td>
                                            <td>
                                                <span className={`badge bg-${task.priority === 'High' ? 'danger' :
                                                    task.priority === 'Medium' ? 'warning' : 'info'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge bg-${task.status === 'Completed' ? 'success' :
                                                    task.status === 'Overdue' ? 'danger' :
                                                        task.status === 'In Progress' ? 'warning' : 'info'
                                                    }`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleEdit(task._id)}
                                                    disabled={task.status === 'Completed'}
                                                    style={{ opacity: task.status === 'Completed' ? 0.5 : 1 }}
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default AssignedTasks
