import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import authContext from '../../context/auth/authContext';
import alertContext from '../../context/alert/alertContext';
import NotAuthorized from '../NotAuthorized';
import Loading from '../Loading';

const AddProjects = () => {
    const navigate = useNavigate();
    const { loggedIn, userType, authToken } = useContext(authContext);
    const { showAlert } = useContext(alertContext);
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const [billImage, setBillImage] = useState(null);
    const [formData, setFormData] = useState({
        projectId: '',
        projectName: '',
        URL: '',
        contactPerson: '',
        email: '',
        phone: '',
        agreementDate: '',
        billingDate: '',
        billAmount: ''
    });

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

    useEffect(() => {
        const fetchLatestProjectId = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/projects/getprojects', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': authToken
                    }
                });

                if (!response.ok) {
                    console.error('Failed to fetch projects:', response.status);
                    // If we can't fetch projects, start with 1
                    setFormData(prev => ({ ...prev, projectId: '1' }));
                    return;
                }

                const projects = await response.json();
                console.log('Fetched projects:', projects);

                // Handle case when there are no projects or invalid response
                if (!projects || !Array.isArray(projects) || projects.length === 0) {
                    console.log('No existing projects found, starting with 1');
                    setFormData(prev => ({ ...prev, projectId: '1' }));
                    return;
                }

                // Find the highest projectId and increment by 1
                const highestProjectId = projects.reduce((max, project) => {
                    if (!project || !project.projectId) return max;
                    // Extract number from projectId
                    const currentId = parseInt(project.projectId) || 0;
                    return currentId > max ? currentId : max;
                }, 0);

                console.log('Highest ID found:', highestProjectId);
                const newProjectId = (highestProjectId + 1).toString();
                console.log('Generated new ID:', newProjectId);
                setFormData(prev => ({ ...prev, projectId: newProjectId }));
            } catch (error) {
                console.error('Error in fetchLatestProjectId:', error);
                // If there's any error, default to 1
                setFormData(prev => ({ ...prev, projectId: '1' }));
                showAlert('Using default project ID 1', 'info');
            }
        };

        if (authToken) {
            fetchLatestProjectId();
        }
    }, [authToken, showAlert]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        
        // Validate file sizes
        const invalidFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
        if (invalidFiles.length > 0) {
            showAlert(`Some files exceed the 10MB limit. Please select smaller files.`, 'danger');
            e.target.value = ''; // Clear the input
            return;
        }

        // Validate file types
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx'];
        const invalidTypes = selectedFiles.filter(file => {
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            return !allowedTypes.includes(extension);
        });

        if (invalidTypes.length > 0) {
            showAlert(`Some files have unsupported formats. Please select only PDF, DOC, DOCX, TXT, XLS, or XLSX files.`, 'danger');
            e.target.value = ''; // Clear the input
            return;
        }

        setFiles(selectedFiles);
    };

    const handleBillImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                showAlert('Bill image exceeds the 10MB limit. Please select a smaller file.', 'danger');
                e.target.value = '';
                return;
            }
            setBillImage(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Format the data
            const projectData = {
                projectId: formData.projectId,
                projectName: formData.projectName.trim(),
                URL: formData.URL.trim() || undefined,
                contactPerson: formData.contactPerson.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                agreementDate: formData.agreementDate || undefined,
                billingDate: formData.billingDate || undefined,
                billAmount: formData.billAmount ? parseFloat(formData.billAmount) : 0
            };

            // Send the request with JSON data
            const response = await fetch('http://localhost:5000/api/projects/createproject', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': authToken
                },
                body: JSON.stringify(projectData)
            });

            const responseData = await response.json();

            if (!response.ok) {
                if (responseData.errors) {
                    const errorMessages = responseData.errors.map(err => err.msg).join(', ');
                    throw new Error(errorMessages);
                } else if (responseData.details) {
                    const errorDetails = typeof responseData.details === 'object' 
                        ? Object.values(responseData.details).filter(Boolean).join(', ')
                        : responseData.details;
                    throw new Error(errorDetails);
                } else {
                    throw new Error(responseData.error || 'Error adding project');
                }
            }

            // If there are files, upload them separately
            if (files.length > 0) {
                const uploadFormData = new FormData();
                files.forEach(file => {
                    uploadFormData.append('documents', file);
                });

                const uploadResponse = await fetch(`http://localhost:5000/api/projects/${responseData._id}/documents`, {
                    method: 'POST',
                    headers: {
                        'auth-token': authToken
                    },
                    body: uploadFormData
                });

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload documents');
                }
            }

            // Upload bill image if present
            if (billImage) {
                const billImageFormData = new FormData();
                billImageFormData.append('billImage', billImage);

                const billImageResponse = await fetch(`http://localhost:5000/api/projects/${responseData._id}/bill-image`, {
                    method: 'POST',
                    headers: {
                        'auth-token': authToken
                    },
                    body: billImageFormData
                });

                if (!billImageResponse.ok) {
                    throw new Error('Failed to upload bill image');
                }
            }

            showAlert('Project added successfully!', 'success');
            navigate('/projects');

            // Reset form
            setFormData({
                projectId: '',
                projectName: '',
                URL: '',
                contactPerson: '',
                email: '',
                phone: '',
                agreementDate: '',
                billingDate: '',
                billAmount: ''
            });
            setFiles([]);
            setBillImage(null);
        } catch (error) {
            console.error('Error:', error);
            showAlert(error.message || 'Error adding project', 'danger');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="container my-3">
            {loggedIn && userType !== "User" ? (
                <div>
                    <h2>+ Add New Project</h2>
                    <form className="node-forms" style={{ width: '80%' }} onSubmit={handleSubmit} encType="multipart/form-data">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label htmlFor="projectId">Project ID</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="projectId"
                                        name="projectId"
                                        value={formData.projectId}
                                        readOnly
                                    />
                                </div>
                                <div className="form-group mb-3">
                                    <label htmlFor="projectName">Project Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="projectName"
                                        name="projectName"
                                        value={formData.projectName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group mb-3">
                                    <label htmlFor="URL">URL</label>
                                    <input
                                        type="url"
                                        className="form-control"
                                        id="URL"
                                        name="URL"
                                        value={formData.URL}
                                        onChange={handleChange}
                                        placeholder="https://example.com"
                                    />
                                </div>
                                <div className="form-group mb-3">
                                    <label htmlFor="contactPerson">Contact Person</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="contactPerson"
                                        name="contactPerson"
                                        value={formData.contactPerson}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group mb-3">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group mb-3">
                                    <label htmlFor="phone">Phone</label>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        maxLength="10"
                                        placeholder="10 digit number"
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-3">
                                    <label htmlFor="agreementDate">Agreement Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        id="agreementDate"
                                        name="agreementDate"
                                        value={formData.agreementDate}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group mb-3">
                                    <label htmlFor="billingDate">Billing Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        id="billingDate"
                                        name="billingDate"
                                        value={formData.billingDate}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group mb-3">
                                    <label htmlFor="documents">Project Documents</label>
                                    <input
                                        type="file"
                                        multiple
                                        className="form-control"
                                        id="documents"
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        You can select multiple files. Each file should be less than 10MB.
                                        Supported formats: PDF, DOC, DOCX, TXT, XLS, XLSX
                                    </p>
                                </div>
                                <div className="form-group mb-3">
                                    <label htmlFor="billImage">Bill Image</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        id="billImage"
                                        onChange={handleBillImageChange}
                                        accept="image/*"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        Upload a bill image (max 10MB). Supported formats: JPG, PNG, GIF
                                    </p>
                                    {billImage && (
                                        <div className="mt-2">
                                            <p className="text-sm">Selected bill image:</p>
                                            <p className="text-sm">{billImage.name} ({(billImage.size / 1024 / 1024).toFixed(2)} MB)</p>
                                        </div>
                                    )}
                                </div>
                                <div className="form-group mb-3">
                                    <label htmlFor="billAmount">Bill Amount</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="billAmount"
                                        name="billAmount"
                                        value={formData.billAmount}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        placeholder="Enter bill amount"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-12">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Adding Project...' : 'Add Project'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                <NotAuthorized />
            )}
        </div>
    );
};

export default AddProjects;