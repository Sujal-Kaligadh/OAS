import React, { useCallback } from 'react'
import NotAuthorized from './NotAuthorized';
import authContext from '../context/auth/authContext';
import alertContext from '../context/alert/alertContext';
import { useState, useContext, useEffect } from 'react';
import Loading from './Loading';
import Alert from './Alert';

function MyTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeMessageId, setActiveMessageId] = useState(null)
  const { user, userType, loggedIn, authToken } = useContext(authContext)
  const { showAlert } = useContext(alertContext)
  const [userNames, setUserNames] = useState({})
  const [showStatusPopup, setShowStatusPopup] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [usePriorityScheduling, setUsePriorityScheduling] = useState(true)

  const handleChangeStatus = async (task, taskId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/task/updatestatus/${taskId}`, {
        method: 'PUT',
        headers: {
          'auth-token': authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const data = await response.json()
      // Update the task status in the local state
      setTasks(tasks.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
      ))
      setShowStatusPopup(false)
      showAlert('Status updated successfully', 'success')
    } catch (error) {
      console.error('Error updating status:', error)
      showAlert('Failed to update status', 'danger')
    }
  }

  const StatusPopup = ({ task, taskId, onClose }) => {
    const statusOptions = ['Pending', 'In Progress', 'Completed']
    
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
           style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
        <div className="bg-white p-4 rounded shadow" style={{ minWidth: '300px' }}>
          <h5 className="mb-3">Change Status for Task: {task}</h5>
          <div className="d-flex flex-column gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                className="btn btn-outline-primary text-start"
                onClick={() => handleChangeStatus(task, taskId, status)}
              >
                {status}
              </button>
            ))}
          </div>
          <button 
            className="btn btn-secondary mt-3 w-100"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const getUserName = async (userId) => {
    if (!userId) return "None";
    try {
      const response = await fetch(`http://localhost:5000/api/auth/getassigner/${userId}`, {
        method: 'GET',
        headers: {
          'auth-token': authToken,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) { 
        throw new Error('Failed to fetch user name')
      }

      const data = await response.json()
      console.log(data);
      return data
    } catch (error) { 
      console.error('Error fetching user name:', error)
      return "Unknown"
    }
  }

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
        setTasks(data)
        setError(null)

        // Fetch user names
        const uniqueUserIds = [...new Set(
          data.map(task => task.assigner).filter(id => id)
        )];

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
        console.error('Error fetching tasks:', error)
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

  const getTaskStatus = (task) => {
    const now = new Date();
    const deadline = new Date(task.deadline);
    const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    if (task.status === 'Completed') {
      return 'Completed';
    }

    if (daysUntil < 0) {
      return 'Overdue';
    }

    return task.status;
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
        return deadlineA - deadlineB;
      }

      // Sort by final score (higher score = higher priority)
      return scoreB - scoreA;
    });
  };

  const scheduledTasks = usePriorityScheduling ? priorityScheduling(tasks) : tasks;

  if (!loggedIn) {
    return <NotAuthorized />;
  }

  return (
    <div className="container my-3">
      <h2>My Tasks</h2>
      
      {error && (
        <Alert message={error} type="danger" />
      )}

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <p className="mb-0">Total Tasks: {tasks.length}</p>
            <div className="form-check">
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
          {tasks.length === 0 ? (
            <p className="text-center">No tasks found</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Task ID</th>
                    <th>Assigner</th>
                    <th>Task</th>
                    <th>Deadline</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledTasks.map(task => (
                    <tr key={task._id}>
                      <td>{task.taskId}</td>
                      <td>{userNames[task.assigner] || 'Unknown'}</td>
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

                        {task.attachment && (
                          <span className="attachment" style={{
                            cursor: 'pointer'
                          }}
                            onClick={() => {
                              window.open(task.attachment, '_blank');
                            }}>📄</span>
                        )}
                      </td>
                      <td>{new Date(task.deadline).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge bg-${
                          task.priority === 'High' ? 'danger' :
                          task.priority === 'Medium' ? 'warning' : 'info'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${
                          getTaskStatus(task) === 'Completed' ? 'success' :
                          getTaskStatus(task) === 'Overdue' ? 'danger' :
                          getTaskStatus(task) === 'In Progress' ? 'warning' : 'info'
                        }`}>
                          {getTaskStatus(task)}
                        </span>
                        <span 
                          className='mx-2 change-status' 
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedTaskId(task._id)
                            setShowStatusPopup(true)
                            setSelectedTask(task.taskId)
                          }}
                        >
                          🛠
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {showStatusPopup && (
        <StatusPopup 
          taskId={selectedTaskId} 
          task={selectedTask}
          onClose={() => setShowStatusPopup(false)} 
        />
      )}
    </div>
  );
}

export default MyTasks;
