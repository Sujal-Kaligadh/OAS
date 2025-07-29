import React from 'react'
import NotAuthorized from './NotAuthorized';
import authContext from '../context/auth/authContext';
import alertContext from '../context/alert/alertContext';
import { useState, useContext, useEffect } from 'react';
import Loading from './Loading';
import AddBtn from './AddBtn';

function Tasks() {
  const { loggedIn, userType, authToken, user } = useContext(authContext);
  const { showAlert } = useContext(alertContext);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [userNames, setUserNames] = useState({});
  const [filters, setFilters] = useState({
    message: '',
    status: '',
    priority: '',
    deadline: '',
    assigner: user ? user._id : '',
    recipient: ''
  });
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [usePriorityScheduling, setUsePriorityScheduling] = useState(true);

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
          setError('Authentication required');
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:5000/api/task/gettasks', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'auth-token': authToken
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch tasks');
        }

        const data = await response.json();

        // Check for overdue tasks and update their status
        const now = new Date();
        let updatedCount = 0;
        const updatedTasks = await Promise.all(data.map(async task => {
          const deadline = new Date(task.deadline);
          const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

          // If task is not completed and is overdue, update its status
          if (task.status !== 'Completed' && daysUntil < 0 && task.status !== 'Overdue') {
            const updatedTask = await updateTaskStatus(task._id, 'Overdue');
            if (updatedTask) {
              updatedCount++;
              return updatedTask;
            }
          }
          return task;
        }));

        if (updatedCount > 0) {
          showAlert(`${updatedCount} task(s) marked as overdue`, 'info');
        }

        setTasks(updatedTasks.filter(Boolean)); 
        setError(null);

        // Fetch user names
        const uniqueUserIds = [...new Set([
          ...updatedTasks.map(task => task.assigner),
          ...updatedTasks.map(task => task.recipient).filter(id => id)
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
        console.error('Error fetching tasks:', error);
        setError(error.message || 'Failed to fetch tasks');
        showAlert(error.message || 'Error fetching tasks', 'danger');
      } finally {
        setLoading(false);
      }
    };

    if (loggedIn && authToken) {
      fetchTasks();
    }

  }, [authToken, loggedIn, showAlert]);

  // Get the name of the user who assigned the task
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

  // Add updateTaskStatus function
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/task/updatestatus/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': authToken
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update task status: ${response.status}`);
      }

      const updatedTask = await response.json();
      if (!updatedTask) {
        throw new Error('No data received after status update');
      }

      showAlert(`Task status updated to ${newStatus}`, 'success');
      return updatedTask;
    } catch (error) {
      console.error('Error updating task status:', error);
      showAlert(error.message || 'Error updating task status', 'danger');
      return null;
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredTasks = tasks.filter(task => {
    const messageMatch = task.message.toLowerCase().includes(filters.message.toLowerCase());
    const statusMatch = filters.status === '' || task.status === filters.status;
    const priorityMatch = filters.priority === '' || task.priority === filters.priority;
    const deadlineMatch = filters.deadline === '' || new Date(task.deadline).toISOString().split('T')[0] === filters.deadline;
    const assignerMatch = filters.assigner === '' || task.assigner === filters.assigner;
    const recipientMatch = filters.recipient === '' || task.recipient === filters.recipient;

    return messageMatch && statusMatch && priorityMatch && deadlineMatch && assignerMatch && recipientMatch;
  });

  const priorityScheduling = (tasks) => {

    return [...tasks].sort((a, b) => {
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

      const now = new Date();
      const deadlineA = new Date(a.deadline);
      const deadlineB = new Date(b.deadline);

      const daysUntilA = Math.ceil((deadlineA - now) / (1000 * 60 * 60 * 24));
      const daysUntilB = Math.ceil((deadlineB - now) / (1000 * 60 * 60 * 24));

      if (a.status === "Completed" && b.status !== "Completed") return 1;
      if (b.status === "Completed" && a.status !== "Completed") return -1;

      let scoreA = priorityWeights[a.priority] + statusWeights[a.status];
      let scoreB = priorityWeights[b.priority] + statusWeights[b.status];


      const deadlineWeight = 10; // Weight factor for deadline
      scoreA += (30 - daysUntilA) * deadlineWeight;
      scoreB += (30 - daysUntilB) * deadlineWeight;

      if (scoreA === scoreB) {
        return deadlineA - deadlineB;
      }
      return scoreB - scoreA;
    });
  };

  const scheduledTasks = usePriorityScheduling ? priorityScheduling(filteredTasks) : filteredTasks;

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

  return (
    <div className="container my-3">
      {loggedIn ? (

        <div>
          <h2>Tasks</h2>
          {userType !== 'User' && <AddBtn btntext="Task" link="/node/add/tasks" />}
          <p>Total Tasks: {filteredTasks.length}</p>

          {loading && <Loading />}

          {!loading && tasks.length === 0 && <p className="text-center">No tasks found</p>}


          {tasks.length > 0 && (
            <>
              <div className="filters-container mb-3">
                <div className="row g-3">

                  <div className="col-md-2">
                    <select
                      className="form-control"
                      name="assigner"
                      value={filters.assigner}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Assigners</option>
                      {[...new Set(tasks.map(task => task.assigner))].map(assignerId => (
                        <option key={assignerId} value={assignerId}>
                          {userNames[assignerId] || "Loading..."}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-control"
                      name="recipient"
                      value={filters.recipient}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Recipients</option>
                      {[...new Set(tasks.map(task => task.recipient))].map(recipientId => (
                        <option key={recipientId} value={recipientId}>
                          {userNames[recipientId] || "Loading..."}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Filter by message..."
                      name="message"
                      value={filters.message}
                      onChange={handleFilterChange}
                    />
                  </div>

                  <div className="col-md-2">
                    <select
                      className="form-control"
                      name="priority"
                      value={filters.priority}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Priority</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
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
                  <div className="col-md-2">
                    <select
                      className="form-control"
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Working">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>

                  <div className="col-md-2">
                    <div className="form-check mt-2 form-switch">
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
              </div>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Assigner</th>
                      <th>Recipient</th>
                      {/* <th>Message</th> */}


                      <th>Task</th>
                      <th>Deadline</th>
                      <th>Priority</th>
                      <th>Status</th>
                      {/* <th>Actions</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledTasks.map(task => (
                      <tr key={task._id}>
                        <td>{task.taskId}</td>
                        <td>{userNames[task.assigner] || "Loading..."}</td>
                        <td>{userNames[task.recipient] || "Loading..."}</td>
                        {/* <td>{task.message}</td> */}

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
                          <span className={`badge bg-${task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'info'}`}>
                            {task.priority}
                          </span>
                        </td>

                        <td>
                          <span className={`badge bg-${getTaskStatus(task) === 'Completed' ? 'success' :
                            getTaskStatus(task) === 'Overdue' ? 'danger' :
                              getTaskStatus(task) === 'In Progress' ? 'warning' : 'info'}`}>
                            {getTaskStatus(task)}
                          </span>
                        </td>

                        {/* <td>
                          {userType !== 'User' && (
                            <Link to={`/node/edit/tasks/${task._id}`}>
                              <button className="btn btn-sm btn-primary">Edit</button>
                            </Link>
                          )}
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : (
        <NotAuthorized />
      )}
    </div>
  );
}

export default Tasks