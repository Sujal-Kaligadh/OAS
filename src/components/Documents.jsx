import React, { useContext, useEffect, useState } from 'react';
import NotAuthorized from './NotAuthorized';
import authContext from '../context/auth/authContext';
import alertContext from '../context/alert/alertContext';
import AddBtn from './AddBtn';
import Loading from './Loading';
import { Link } from 'react-router';
import viewFileIcon from '../assets/viewfile.png';

function Documents() {
    const { loggedIn, userType, authToken } = useContext(authContext);
    const { showAlert } = useContext(alertContext);
    const [loading, setLoading] = useState(true);
    const [documents, setDocuments] = useState([]);
    const [filters, setFilters] = useState({
        fileName: '',
        fileType: ''
    });

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/documents",
                    {
                        method: "GET",
                        headers: {
                            'Content-Type': 'application/json',
                            'auth-token': authToken,
                        },
                    })

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                let documentData = await response.json();
                setDocuments(documentData);
                setLoading(false);
            }
            catch (error) {
                console.error("Error fetching documents:", error);
                setLoading(false);
            }
        }

        fetchDocuments();
    }, [authToken]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDelete = async (documentId) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                const response = await fetch(`http://localhost:5000/api/documents/${documentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': authToken,
                    },
                });

                if (response.ok) {
                    setDocuments(documents.filter(doc => doc._id !== documentId));
                    showAlert('Document deleted successfully', 'success');
                } else {
                    showAlert('Failed to delete document', 'danger');
                }
            } catch (error) {
                console.error('Error deleting document:', error);
                showAlert('Error deleting document', 'danger');
            }
        }
    };

    const filteredDocuments = documents.filter(document => {
        const fileNameMatch = document.fileName.toLowerCase().includes(filters.fileName.toLowerCase());
        const fileTypeMatch = filters.fileType ? 
            document.fileType.toLowerCase().includes(filters.fileType.toLowerCase())
            : true;
        return fileNameMatch && fileTypeMatch;
    }).sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="container my-3">
            {loggedIn ? (
                <div>
                    {userType !== 'User' && <AddBtn btntext="Document" link="/node/add/documents" />}
                    
                    <p>Total Documents: {filteredDocuments.length}</p>
                    {loading && <Loading />}

                    {!loading && documents.length === 0 && <p className="text-center">No documents found</p>}

                    {documents.length > 0 && (
                        <>
                            <div className="filters-container mb-3">
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Filter by file name..."
                                            name="fileName"
                                            value={filters.fileName}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Filter by file type..."
                                            name="fileType"
                                            value={filters.fileType}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <table className="table table-striped">
                                <thead className="table-dark">
                                    <tr>
                                        <th>File Name</th>
                                        <th>File Type</th>
                                        <th>File Size</th>
                                        <th>Upload Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredDocuments.map((document) => (
                                        <tr key={document._id}>
                                            <td>{document.fileName}</td>
                                            <td>{document.fileType}</td>
                                            <td>{formatFileSize(document.fileSize)}</td>
                                            <td>{new Date(document.uploadDate).toLocaleDateString()}</td>
                                            <td>
                                                <a 
                                                    href={`http://localhost:5000/documents-attachments/${document.fileName}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-primary mx-1"
                                                >
                                                    View
                                                </a>
                                                {userType !== 'User' && (
                                                    <>
                                                        <Link to={`/node/edit/documents/${document._id}`} className="btn btn-sm btn-secondary mx-1">
                                                            Edit
                                                        </Link>
                                                        <button 
                                                            className="btn btn-sm btn-danger mx-1"
                                                            onClick={() => handleDelete(document._id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            )
                : <NotAuthorized />
            }
        </div>
    );
}

export default Documents; 