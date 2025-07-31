import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router';

import alertContext from '../../context/alert/alertContext';
import authContext from '../../context/auth/authContext';
import NotAuthorized from '../NotAuthorized';

function AddDocuments() {
    const navigate = useNavigate();

    const { showAlert } = useContext(alertContext);
    const { loggedIn, userType, authToken } = useContext(authContext);

    const [files, setFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorDetails, setErrorDetails] = useState(null);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        
        if (selectedFiles.length > 5) {
            showAlert("You can upload a maximum of 5 documents at a time", "danger");
            return;
        }

        // Check file sizes (10MB limit per file)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
        
        if (oversizedFiles.length > 0) {
            showAlert("Some files exceed the 10MB size limit", "danger");
            return;
        }

        setFiles(selectedFiles);
    };

    const handleFileNameChange = (index, newName) => {
        setFiles(files =>
            files.map((file, i) =>
                i === index ? { ...file, customName: newName } : file
            )
        );
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorDetails(null);

        if (files.length === 0) {
            showAlert("Please select at least one file to upload", "danger");
            return;
        }

        if (files.length > 5) {
            showAlert("You can upload a maximum of 5 documents at a time", "danger");
            return;
        }

        setIsSubmitting(true);

        try {
            // Create FormData object for file upload
            const data = new FormData();
            
            files.forEach((file, index) => {
                data.append('documents', file, file.customName || file.name);
            });

            if (!authToken) {
                showAlert("Authentication required", "danger");
                setIsSubmitting(false);
                return;
            }

            // DEBUG: Log what we're sending
            console.log("Submitting files:", files.map(f => f.name));

            const response = await fetch('http://localhost:5000/api/documents', {
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
                throw new Error(responseData.error || `Error: ${response.status}`);
            }

            console.log("Success response:", responseData);
            
            // Reset form after successful submission
            setFiles([]);
            
            // Reset file input by clearing the value
            document.getElementById('input-files').value = '';
            
            navigate("/documents")
            showAlert("Documents uploaded successfully", "success");
        } catch (error) {
            console.error("Error submitting form:", error);
            setErrorDetails(error.message);
            showAlert(`Failed to upload documents: ${error.message}`, "danger");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="container my-3">
            {loggedIn && userType !== "User" ? (
                <div>
                    <h2>+ Add Documents</h2>

                    <form className="node-forms" style={{ width: '60%' }} onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="input-files" className="form-label">Documents</label>
                            <input
                                type="file"
                                className="form-control"
                                onChange={handleFileChange}
                                name="documents"
                                id="input-files"
                                multiple
                                required
                            />
                            <small className="form-text text-muted">
                                Maximum 5 files, 10MB per file. Supported formats: PDF, DOC, DOCX, TXT, etc.
                            </small>
                        </div>

                        {files.length > 0 && (
                            <div className="mb-3">
                                <label className="form-label">Selected Files ({files.length}/5):</label>
                                <div className="list-group">
                                    {files.map((file, index) => (
                                        <div key={index} className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                                            <div className="flex-grow-1 me-3">
                                                <div className="mb-2">
                                                    <label className="form-label small mb-1">File Name:</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={file.customName || file.name}
                                                        onChange={e => handleFileNameChange(index, e.target.value)}
                                                        placeholder="Enter custom file name (optional)"
                                                    />
                                                </div>
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <small className="text-muted">
                                                            <strong>Size:</strong> {formatFileSize(file.size)}
                                                        </small>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <small className="text-muted">
                                                            <strong>Type:</strong> {file.type || 'Unknown'}
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger mt-2 mt-md-0"
                                                onClick={() => removeFile(index)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {errorDetails && (
                            <div className="alert alert-danger">
                                <strong>Error Details:</strong> {errorDetails}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={isSubmitting || files.length === 0}
                        >
                            {isSubmitting ? 'Uploading...' : `Upload ${files.length} Document${files.length !== 1 ? 's' : ''}`}
                        </button>
                    </form>
                </div>
            ) : (
                <NotAuthorized />
            )}
        </div>
    );
}

export default AddDocuments; 