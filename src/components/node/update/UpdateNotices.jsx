import React from 'react'
import { useContext, useState, useEffect } from 'react';
import authContext from '../../../context/auth/authContext';
import alertContext from '../../../context/alert/alertContext';
import { useParams, useNavigate, Link } from 'react-router';

function UpdateNotices() {
    const { authToken } = useContext(authContext);
    const { showAlert } = useContext(alertContext);
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        publishedDate: new Date().toISOString().split('T')[0],
        description: ''
    });

    const [fileData, setFileData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorDetails, setErrorDetails] = useState(null);
    const [currentFile, setCurrentFile] = useState('');

    useEffect(() => {
        const fetchNotice = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/notice/getnotice/${id}`, {
                    headers: {
                        'auth-token': authToken
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const noticeData = await response.json();
                setFormData({
                    title: noticeData.title,
                    publishedDate: new Date(noticeData.publishedDate).toISOString().split('T')[0],
                    description: noticeData.description || ''
                });
                setCurrentFile(noticeData.file || '');
            } catch (error) {
                console.error("Error fetching notice:", error);
                showAlert("Error fetching notice details", "danger");
            }
        };

        fetchNotice();
    }, [id, authToken]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFileData(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('publishedDate', formData.publishedDate);
            formDataToSend.append('description', formData.description);

            if (fileData) {
                formDataToSend.append('noticeFile', fileData);
            }

            const response = await fetch(`http://localhost:5000/api/notice/updatenotice/${id}`, {
                method: 'PUT',
                headers: {
                    'auth-token': authToken
                },
                body: formDataToSend
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            showAlert("Notice updated successfully", "success");
            navigate(`/notices`);
        } catch (error) {
            console.error("Error updating notice:", error);
            setErrorDetails(error.message);
            showAlert(`Failed to update notice: ${error.message}`, "danger");
        } finally {
            setIsSubmitting(false);
        }
        };

    const handleDelete = async () => {
        try {
            if (!window.confirm("Are you sure you want to delete this notice?")) {
                return;
            }

            const response = await fetch(`http://localhost:5000/api/notice/deletenotice/${id}`, {
                method: 'DELETE',
                headers: {
                    'auth-token': authToken
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            showAlert("Notice deleted successfully", "success");
            navigate(`/notices`);
        } catch (error) {
            console.error("Error deleting notice:", error);             
            showAlert(`Failed to delete notice: ${error.message}`, "danger");
        }
    };

    return (
        <div className="container my-3">
            <h2>Update Notice</h2>

            <form className="node-forms" style={{ width: '40%' }} onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="input-title" className="form-label">Title</label>
                    <input
                        type="text"
                        className="form-control"
                        onChange={handleChange}
                        value={formData.title}
                        name="title"
                        id="input-title"
                        required
                        minLength="3"
                    />
                    <small className="form-text text-muted">Must be at least 3 characters</small>
                </div>

                <div className="mb-3">
                    <label htmlFor="input-file" className="form-label">File</label>
                    {currentFile && (
                        <div className="mb-2">
                            <strong>Current file: </strong>
                            <a href={`http://localhost:5000${currentFile}`} target="_blank" rel="noopener noreferrer">
                                View Current File
                            </a>
                        </div>
                    )}
                    <input
                        type="file"
                        className="form-control"
                        onChange={handleFileChange}
                        name="noticeFile"
                        id="input-file"
                        required={!currentFile}
                    />
                    <small className="form-text text-muted">Maximum file upload size: 10MB. Leave empty to keep the current file.</small>
                </div>

                <div className="mb-3">
                    <label htmlFor="input-date" className="form-label">Published Date</label>
                    <input
                        type="date"
                        className="form-control"
                        id="input-date"
                        onChange={handleChange}
                        value={formData.publishedDate}
                        name="publishedDate"
                        style={{ width: '50%' }}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="input-description" className="form-label">Description (Optional)</label>
                    <textarea
                        className="form-control"
                        id="input-description"
                        onChange={handleChange}
                        value={formData.description}
                        name="description"
                        rows="3"
                    />
                </div>

                {errorDetails && (
                    <div className="alert alert-danger">
                        <strong>Error Details:</strong> {errorDetails}
                    </div>
                )}

                <div>
                    <button
                        type="submit"
                        className="btn btn-primary me-3"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Updating...' : 'Update'}
                    </button>

                    <button
                        type="button"
                        className="btn btn-danger"
                        disabled={isSubmitting}
                        onClick={handleDelete}
                    >
                        Delete
                    </button>
                </div>
            </form>
        </div>
    )
}

export default UpdateNotices
