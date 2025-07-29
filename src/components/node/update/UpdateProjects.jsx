import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import authContext from '../../../context/auth/authContext';
import alertContext from '../../../context/alert/alertContext';
import NotAuthorized from '../../NotAuthorized';
import Loading from '../../Loading';

const UpdateProjects = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { loggedIn, userType, authToken } = useContext(authContext);
    const { showAlert } = useContext(alertContext);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [files, setFiles] = useState([]);
    const [existingDocs, setExistingDocs] = useState([]);
    const [billImage, setBillImage] = useState(null);
    const [existingBillImage, setExistingBillImage] = useState(null);
    const [formData, setFormData] = useState({
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
        const fetchProject = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:5000/api/projects/getprojects/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': authToken
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch project: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                if (!data) {
                    throw new Error('No project data received');
                }

                setFormData({
                    projectName: data.projectName || '',
                    URL: data.URL || '',
                    contactPerson: data.contactPerson || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    agreementDate: data.agreementDate ? new Date(data.agreementDate).toISOString().split('T')[0] : '',
                    billingDate: data.billingDate ? new Date(data.billingDate).toISOString().split('T')[0] : '',
                    billAmount: data.billAmount || ''
                });

                // Set existing documents
                if (data.projectDocs && Array.isArray(data.projectDocs)) {
                    setExistingDocs(data.projectDocs);
                }

                // Set existing bill image
                if (data.billImage) {
                    setExistingBillImage(data.billImage);
                }
            } catch (error) {
                showAlert(error.message || 'Error fetching project', 'danger');
                navigate('/projects');
            } finally {
                setLoading(false);
            }
        };

        if (authToken && id) {
            fetchProject();
        } else {
            showAlert('Missing authentication or project ID', 'danger');
            navigate('/projects');
        }
    }, [authToken, id, showAlert, navigate]);

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

    const handleDeleteDoc = async (docId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/projects/${id}/documents/${docId}`, {
                method: 'DELETE',
                headers: {
                    'auth-token': authToken
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete document');
            }

            // Remove the document from the state
            setExistingDocs(prevDocs => prevDocs.filter(doc => doc._id !== docId));
            showAlert('Document deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting document:', error);
            showAlert(error.message || 'Error deleting document', 'danger');
        }
    };

    const handleDownloadDoc = async (docId, fileName) => {
        try {
            const response = await fetch(`http://localhost:5000/api/projects/${id}/documents/${docId}/download`, {
                headers: {
                    'auth-token': authToken
                }
            });

            if (!response.ok) {
                throw new Error('Failed to download document');
            }

            // Convert the response to a blob
            const blob = await response.blob();
            
            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link element
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            
            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the URL
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading document:', error);
            showAlert(error.message || 'Error downloading document', 'danger');
        }
    };

    const handleDeleteBillImage = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/projects/${id}/bill-image`, {
                method: 'DELETE',
                headers: {
                    'auth-token': authToken
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete bill image');
            }

            setExistingBillImage(null);
            showAlert('Bill image deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting bill image:', error);
            showAlert(error.message || 'Error deleting bill image', 'danger');
        }
    };

    const handleDownloadBillImage = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/projects/${id}/bill-image`, {
                headers: {
                    'auth-token': authToken
                }
            });

            if (!response.ok) {
                throw new Error('Failed to download bill image');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = existingBillImage.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading bill image:', error);
            showAlert(error.message || 'Error downloading bill image', 'danger');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        if (formData.agreementDate && formData.billingDate) {
            const agreementDate = new Date(formData.agreementDate);
            const billingDate = new Date(formData.billingDate);
            if (agreementDate >= billingDate) {
                showAlert('Agreement Date must be less than Billing Date', 'danger');
                setSubmitting(false);
                return;
            }
        }

        try {
            // Format the data
            const projectData = {
                projectName: formData.projectName.trim(),
                URL: formData.URL.trim(),
                contactPerson: formData.contactPerson.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                agreementDate: formData.agreementDate || undefined,
                billingDate: formData.billingDate || undefined,
                billAmount: formData.billAmount ? parseFloat(formData.billAmount) : 0
            };

            // Send the request with JSON data
            const response = await fetch(`http://localhost:5000/api/projects/updateprojects/${id}`, {
                method: 'PUT',
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
                    throw new Error(responseData.error || 'Error updating project');
                }
            }

            // If there are new files, upload them
            if (files.length > 0) {
                const uploadFormData = new FormData();
                files.forEach(file => {
                    uploadFormData.append('documents', file);
                });

                const uploadResponse = await fetch(`http://localhost:5000/api/projects/${id}/documents`, {
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

            // Handle bill image
            if (billImage) {
                // Upload new bill image
                const billImageFormData = new FormData();
                billImageFormData.append('billImage', billImage);

                const billImageResponse = await fetch(`http://localhost:5000/api/projects/${id}/bill-image`, {
                    method: 'POST',
                    headers: {
                        'auth-token': authToken
                    },
                    body: billImageFormData
                });

                if (!billImageResponse.ok) {
                    throw new Error('Failed to upload bill image');
                }
            } else if (!existingBillImage) {
                // Remove bill image if no new image and no existing image
                const deleteResponse = await fetch(`http://localhost:5000/api/projects/${id}/bill-image`, {
                    method: 'DELETE',
                    headers: {
                        'auth-token': authToken
                    }
                });

                if (!deleteResponse.ok) {
                    throw new Error('Failed to remove bill image');
                }
            }

            showAlert('Project updated successfully!', 'success');
            navigate('/projects');
        } catch (error) {
            console.error('Error:', error);
            showAlert(error.message || 'Error updating project', 'danger');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:5000/api/projects/deleteprojects/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'auth-token': authToken
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to delete project');
                }

                showAlert('Project deleted successfully', 'success');
                navigate('/projects');
            } catch (error) {
                showAlert(error.message || 'Error deleting project', 'danger');
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="container my-3">
                <Loading />
            </div>
        );
    }

    return (
        <div className="container my-3">
            {loggedIn && userType !== "User" ? (
                <div>
                    <h2>Edit Project</h2>
                    <form className="node-forms" style={{ width: '80%' }} onSubmit={handleSubmit} encType="multipart/form-data">
                        <div className="row">
                            <div className="col-md-6">
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
                                    {files.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-sm">New files to upload:</p>
                                            <ul className="list-unstyled">
                                                {files.map((file, index) => (
                                                    <li key={index} className="text-sm">
                                                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                    </li>
                                                ))}
                                            </ul>
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
                                            <p className="text-sm">New bill image:</p>
                                            <p className="text-sm">{billImage.name} ({(billImage.size / 1024 / 1024).toFixed(2)} MB)</p>
                                        </div>
                                    )}
                                </div>
                                <div className="form-group mb-3">
                                    {existingBillImage && existingBillImage.fileName && (
                                        <div className="mt-2">
                                            <p className="text-sm">Current bill image:</p>
                                            <p className="text-sm">{existingBillImage.fileName}</p>
                                            <div className="btn-group">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-danger"
                                                    onClick={handleDeleteBillImage}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Existing Documents Section */}
                        {existingDocs.length > 0 && (
                            <div className="row mt-3">
                                <div className="col-12">
                                    <h4>Existing Documents</h4>
                                    <div className="table-responsive">
                                        <table className="table table-striped">
                                            <thead>
                                                <tr>
                                                    <th>File Name</th>
                                                    <th>Size</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {existingDocs.map((doc) => (
                                                    <tr key={doc._id}>
                                                        <td>{doc.fileName}</td>
                                                        <td>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => handleDeleteDoc(doc._id)}
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="row mt-3">
                            <div className="col-12">
                                <button type="submit" className="btn btn-primary me-2" disabled={loading || submitting}>
                                    {submitting ? 'Updating Project...' : 'Update Project'}
                                </button>
                                <button 
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={handleDelete}
                                    disabled={loading || submitting}
                                >
                                    Delete Project
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

export default UpdateProjects; 