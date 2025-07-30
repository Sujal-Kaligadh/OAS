import React, { useContext, useEffect, useState } from 'react'
import authContext from '../../context/auth/authContext'
import alertContext from '../../context/alert/alertContext'
import NotAuthorized from '../NotAuthorized'
import { useNavigate } from 'react-router';

function AddTask() {
    const navigate = useNavigate();
    const { loggedIn, userType, authToken } = useContext(authContext);
    const { showAlert } = useContext(alertContext);
    const [formData, setFormData] = useState({
        taskId: '',
        recipient: '',
        message: '',
        link: '',
        attachments: '',
        status: '1', // default value
        priority: '2', // default value
        deadline: ''
    });     


    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLatestTaskId = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/task/gettasks', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': authToken
                    }
                });

                if (!response.ok) {
                    console.error('Failed to fetch tasks:', response.status);
                    // If we can't fetch tasks, start with #001
                    setFormData(prev => ({ ...prev, taskId: '#001' }));
                    return;
                }

                const tasks = await response.json();
                console.log('Fetched tasks:', tasks);

                // Handle case when there are no tasks or invalid response
                if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
                    console.log('No existing tasks found, starting with #001');
                    setFormData(prev => ({ ...prev, taskId: '#001' }));
                    return;
                }

                // Find the highest taskId and increment by 1
                const highestTaskId = tasks.reduce((max, task) => {
                    if (!task || !task.taskId) return max;
                    // Extract number from taskId (e.g., "#001" -> 1)
                    const currentId = parseInt(task.taskId.replace('#', '')) || 0;
                    return currentId > max ? currentId : max;
                }, 0);

                console.log('Highest ID found:', highestTaskId);
                const newTaskId = `#${(highestTaskId + 1).toString().padStart(3, '0')}`;
                console.log('Generated new ID:', newTaskId);
                setFormData(prev => ({ ...prev, taskId: newTaskId }));
            } catch (error) {
                console.error('Error in fetchLatestTaskId:', error);
                // If there's any error, default to #001
                setFormData(prev => ({ ...prev, taskId: '#001' }));
                showAlert('Using default task ID #001', 'info');
            }
        };

        if (authToken) {
            fetchLatestTaskId();
        }
    }, [authToken, showAlert]);

    useEffect(() => {
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
                    
                    const filteredUsers = data.filter(user => user.type === "User" || user.type === "Manager");
                    setUsers(filteredUsers);
                } else {
                    console.error('Received non-array data:', data);
                    setUsers([]);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                showAlert('Error fetching users', 'error');
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };

        if (authToken) {
            fetchUsers();
        }
    }, [authToken, showAlert]);   
    
    
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Validate taskId is present
            if (!formData.taskId) {
                showAlert('Task ID is missing', 'danger');
                return;
            }

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

            // Create FormData instead of JSON
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

            console.log('Submitting task with data:', Object.fromEntries(formDataToSend));

            const response = await fetch('http://localhost:5000/api/task/addtask', {
                method: 'POST',
                headers: {
                    'auth-token': authToken
                },
                body: formDataToSend
            }); 

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server error response:', errorData);
                throw new Error(errorData.error || 'Failed to add task');
            }

            const data = await response.json(); 
            console.log('Server response:', data);  
            showAlert('Task added successfully', 'success');
            navigate('/tasks');

            // Reset form
            setFormData({
                taskId: '',
                recipient: '',
                message: '',
                link: '',
                attachments: '',
                status: '1',
                priority: '2',
                deadline: ''
            });
            document.querySelector('#attachments').value = '';
            
        } catch (error) {
            console.error('Error adding task:', error);
            showAlert(error.message || 'Error adding task', 'danger');
        }
    }

    return (
        <div className="container my-3">
            {loggedIn && userType !== "User" ? (
                <div>
                    <h2>+ Add Task</h2>
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
                                        <option value="">Select a recipient</option>
                                        {loading ? (
                                            <option>Loading users...</option>
                                        ) : users.length > 0 ? (
                                            users.map(user => (
                                                <option key={user._id} value={user._id}>
                                                    {user.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option>No users available</option>
                                        )}
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
                                <button type="submit" className="btn btn-primary">Add Task</button>
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

export default AddTask
