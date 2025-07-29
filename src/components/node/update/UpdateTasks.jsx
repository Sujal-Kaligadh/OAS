import React, { useContext, useEffect, useState } from 'react'
import authContext from '../../../context/auth/authContext'
import alertContext from '../../../context/alert/alertContext'
import NotAuthorized from '../../NotAuthorized'
import { useNavigate, useParams } from 'react-router';
import Loading from '../../Loading';

function UpdateTasks() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { loggedIn, userType, authToken } = useContext(authContext);
    const { showAlert } = useContext(alertContext);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        taskId: '',
        recipient: '',
        message: '',
        link: '',
        attachments: '',
        status: '1',
        priority: '2',
        deadline: ''
    });     

    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                console.log('Fetching task with ID:', id);
                const response = await fetch(`http://localhost:5000/api/task/gettask/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': authToken
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch task');
                }

                const task = await response.json();
                console.log('Fetched task:', task);
                
                // Map status and priority back to their numeric values
                const statusMap = {
                    'Pending': '1',
                    'In Progress': '2',
                    'Completed': '3',
                    'Overdue': '4'
                };
                
                const priorityMap = {
                    'Low': '1',
                    'Medium': '2',
                    'High': '3'
                };

                setFormData({
                    taskId: task.taskId,
                    recipient: task.recipient,
                    message: task.message,
                    link: task.link || '',
                    attachments: task.attachments || '',
                    status: statusMap[task.status] || '1',
                    priority: priorityMap[task.priority] || '2',
                    deadline: new Date(task.deadline).toISOString().split('T')[0]
                });
            } catch (error) {
                console.error('Error fetching task:', error);
                showAlert(error.message || 'Error fetching task', 'danger');
            } finally {
                setLoading(false);
            }
        };

        const fetchUsers = async () => {
            try {
                if (!authToken) {
                    console.error('No auth token available');
                    return;
                }
                
                const response = await fetch('http://localhost:5000/api/auth/getalluser', {
                    method: 'GET',
                    headers: {
                        'auth-token': authToken
                    }
                });   

                if (!response.ok) {
                    throw new Error('Failed to fetch users');
                }

                const data = await response.json();
                if (Array.isArray(data)) {
                    // Filter only users with role "User"
                    const filteredUsers = data.filter(user => user.type === "User");
                    setUsers(filteredUsers);
                } else {
                    console.error('Received non-array data:', data);
                    setUsers([]);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                showAlert('Error fetching users', 'error');
                setUsers([]);
            }
        };

        if (authToken) {
            fetchTask();
            fetchUsers();
        }
    }, [authToken, id, showAlert]);   
    
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Map status and priority to their corresponding enum values
            const statusMap = {
                '1': 'Pending',
                '2': 'In Progress',
                '3': 'Completed',
                '4': 'Overdue'
            };
            
            const priorityMap = {
                '1': 'Low',
                '2': 'Medium',
                '3': 'High'
            };

            // Create FormData
            const formDataToSend = new FormData();
            
            // Get the file input element
            const fileInput = document.querySelector('#attachments');
            if (fileInput && fileInput.files && fileInput.files[0]) {
                formDataToSend.append('attachments', fileInput.files[0]);
            }

            // Append other form data
            formDataToSend.append('taskId', formData.taskId);
            formDataToSend.append('recipient', formData.recipient);
            formDataToSend.append('message', formData.message);
            formDataToSend.append('link', formData.link || '');
            formDataToSend.append('status', statusMap[formData.status]);
            formDataToSend.append('priority', priorityMap[formData.priority]);
            formDataToSend.append('deadline', formData.deadline);

            const response = await fetch(`http://localhost:5000/api/task/updatetask/${id}`, {
                method: 'PUT',
                headers: {
                    'auth-token': authToken
                },
                body: formDataToSend
            }); 

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update task');
            }

            showAlert('Task updated successfully', 'success');
            navigate('/tasks');
            
        } catch (error) {
            console.error('Error updating task:', error);
            showAlert(error.message || 'Error updating task', 'danger');
        }
    }

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="container my-3">
            {loggedIn && userType !== "User" ? (
                <div>
                    <h2>Update Task</h2>
                    <form className="node-forms" style={{ width: '80%' }} onSubmit={handleSubmit} encType="multipart/form-data">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label htmlFor="taskId">Task ID</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        id="taskId" 
                                        name="taskId"
                                        value={formData.taskId}
                                        readOnly
                                    />
                                </div>
                                <div className="form-group mb-3">
                                    <label htmlFor="recipient">Recipient</label>
                                    <select 
                                        className="form-control" 
                                        id="recipient" 
                                        name="recipient"
                                        onChange={handleChange}
                                        value={formData.recipient}
                                        required
                                    >
                                        <option value="">Select Recipient</option>
                                        {users.map(user => (
                                            <option key={user._id} value={user._id}>
                                                {user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group mb-3">
                                    <label htmlFor="message">Message</label>
                                    <textarea 
                                        rows={5} 
                                        className="form-control" 
                                        id="message" 
                                        name="message"
                                        onChange={handleChange}
                                        value={formData.message}
                                        required
                                    />
                                </div>
                                <div className="form-group mb-3">
                                    <label htmlFor="priority">Priority</label>
                                    <select 
                                        style={{width: '40%'}} 
                                        className="form-control" 
                                        id="priority" 
                                        name="priority"
                                        onChange={handleChange}
                                        value={formData.priority}
                                        required
                                    >        
                                        <option value="1">Low</option>
                                        <option value="2">Medium</option>
                                        <option value="3">High</option>                 
                                    </select>
                                </div>
                                
                                <div className="form-group mb-3">
                                    <label htmlFor="status">Status</label>
                                    <select 
                                        style={{width: '40%'}} 
                                        className="form-control" 
                                        id="status" 
                                        name="status"
                                        onChange={handleChange}
                                        value={formData.status}
                                        required
                                    >
                                        <option value="1">Pending</option>
                                        <option value="2">In Progress</option>  
                                        <option value="3">Completed</option>
                                        <option value="4">Overdue</option>                 
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label htmlFor="link">Link</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        id="link" 
                                        name="link"
                                        onChange={handleChange}
                                        value={formData.link}
                                    />
                                </div>
                                <div className="form-group mb-3">
                                    <label htmlFor="attachments">Attachments</label>
                                    <input 
                                        type="file" 
                                        className="form-control" 
                                        id="attachments" 
                                        name="attachments"
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group mb-3">
                                    <label htmlFor="deadline">Deadline</label>
                                    <input 
                                        type="date" 
                                        style={{width: '50%'}} 
                                        className="form-control" 
                                        id="deadline" 
                                        name="deadline"
                                        onChange={handleChange}
                                        value={formData.deadline}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-12">
                                <button type="submit" className="btn btn-primary">Update Task</button>
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                <NotAuthorized />
            )}
        </div>
    )
}

export default UpdateTasks
