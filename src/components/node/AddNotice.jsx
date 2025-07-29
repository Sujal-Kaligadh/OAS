import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router';

import alertContext from '../../context/alert/alertContext';
import authContext from '../../context/auth/authContext';
import NotAuthorized from '../NotAuthorized';

function AddNotice() {
    const navigate = useNavigate();

    const { showAlert } = useContext(alertContext);
    const { loggedIn, userType, authToken } = useContext(authContext);

    const [formData, setFormData] = useState({
        title: '',
        publishedDate: new Date().toISOString().split('T')[0],
        description: ''
    });

    const [fileData, setFileData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorDetails, setErrorDetails] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileData(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorDetails(null);

        if (!formData.title || !fileData || !formData.publishedDate) {
            showAlert("Please fill all the required fields", "danger");
            return;
        }

        setIsSubmitting(true);

        try {
            // Create FormData object for file upload
            const data = new FormData();
            data.append('title', formData.title);
            data.append('publishedDate', formData.publishedDate);
            data.append('description', formData.description || '');
            data.append('noticeFile', fileData);

            if (!authToken) {
                showAlert("Authentication required", "danger");
                setIsSubmitting(false);
                return;
            }

            // DEBUG: Log what we're sending
            console.log("Submitting form data:", {
                title: formData.title,
                publishedDate: formData.publishedDate,
                description: formData.description,
                file: fileData ? fileData.name : 'No file'
            });

            const response = await fetch('http://localhost:5000/api/notice/createnotice', {
                method: 'POST',
                headers: {
                    'auth-token': authToken
                    // Note: Don't set Content-Type with FormData as it sets its own boundary
                },
                body: data
            });

            // First try to parse the response as JSON
            let responseData;
            try {
                responseData = await response.json();
            } catch (err) {
                // If we can't parse as JSON, get the text
                const textResponse = await response.text();
                console.error("Server returned non-JSON response:", textResponse);
                throw new Error(`Server error: Non-JSON response`);
            }
            
            if (!response.ok) {
                console.error("Server returned an error:", responseData);
                throw new Error(responseData.message || `Error: ${response.status}`);
            }

            console.log("Success response:", responseData);
            
            // Reset form after successful submission
            setFormData({
                title: '',
                publishedDate: new Date().toISOString().split('T')[0],
                description: ''
            });
            setFileData(null);
            
            // Reset file input by clearing the value
            document.getElementById('input-file').value = '';
            
            navigate("/notices")
            showAlert("Notice added successfully", "success");
        } catch (error) {
            console.error("Error submitting form:", error);
            setErrorDetails(error.message);
            showAlert(`Failed to add notice: ${error.message}`, "danger");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container my-3">
            {loggedIn && userType !== "User" ? (
                <div>
                    <h2>+ Add Notice</h2>

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
                            <input
                                type="file"
                                className="form-control"
                                onChange={handleFileChange}
                                name="noticeFile"
                                id="input-file"
                                required
                            />
                            <small className="form-text text-muted">Maximum file upload size: 10MB</small>
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

                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </form>
                </div>
            ) : (
                <NotAuthorized />
            )}
        </div>
    );
}

export default AddNotice;