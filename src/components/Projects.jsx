import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import authContext from '../context/auth/authContext';
import alertContext from '../context/alert/alertContext';
import NotAuthorized from './NotAuthorized';
import AddBtn from './AddBtn';
import Loading from './Loading';

const Projects = () => {
    const navigate = useNavigate();
    const { loggedIn, userType, authToken, user } = useContext(authContext);
    const { showAlert } = useContext(alertContext);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);
    const [filters, setFilters] = useState({
        projectName: '',
        contactPerson: '',
        email: '',
        agreementDate: '',
        billingDate: ''
    });

    useEffect(() => {
        // setLoading(true);
        const fetchProjects = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/projects/getprojects', {
                    headers: {
                        'auth-token': authToken
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API Response:', {
                        status: response.status,
                        statusText: response.statusText,
                        headers: Object.fromEntries(response.headers.entries()),
                        body: errorText
                    });
                    throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                setProjects(data);
            } catch (error) {
                console.error('Error fetching projects:', error);
                showAlert(error.message || 'Error fetching projects', 'danger');
            } finally {
                setLoading(false);
            }
        };

        if (authToken) {
            fetchProjects();
        }
    }, [authToken, showAlert]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEdit = (projectId) => {
        navigate(`/node/edit/projects/${projectId}`);
    };

    const handleViewDocs = (project) => {
        setSelectedProject(project);
    };

    const handleCloseDocs = () => {
        setSelectedProject(null);
    };

    const handleDownloadDoc = async (projectId, docId, fileName) => {
        try {
            const response = await fetch(`http://localhost:5000/api/projects/${projectId}/documents/${docId}/download`, {
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
            showAlert(error.message || 'Error downloading document', 'danger');
        }
    };

    const handleViewBillImage = (projectId) => {
        const fetchBillImage = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/projects/${projectId}/bill-image`, {
                    headers: {
                        'auth-token': authToken
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch bill image');
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank'); // Open the image in a new tab

            } catch (error) {
                console.error('Error fetching bill image:', error);
                showAlert(error.message || 'Error viewing bill image', 'danger');
            }
        };
        fetchBillImage();
    };

    const filteredProjects = projects.filter(project => {
        const nameMatch = project.projectName.toLowerCase().includes(filters.projectName.toLowerCase());
        const contactMatch = project.contactPerson.toLowerCase().includes(filters.contactPerson.toLowerCase());
        const emailMatch = project.email.toLowerCase().includes(filters.email.toLowerCase());
        const agreementMatch = filters.agreementDate === '' || 
            new Date(project.agreementDate).toISOString().split('T')[0] === filters.agreementDate;
        const billingMatch = filters.billingDate === '' || 
            new Date(project.billingDate).toISOString().split('T')[0] === filters.billingDate;

        return nameMatch && contactMatch && emailMatch && agreementMatch && billingMatch;
    });

    return (
        <div className="container my-3">
            {loggedIn ? (
                <div>
                    <h2>Projects</h2>
                    {userType !== 'User' && <AddBtn btntext="Project" link="/node/add/projects" />}
                    <p>Total Projects: {filteredProjects.length}</p>

                    {loading ? (
                        <Loading />
                    ) : filteredProjects.length > 0 ? (
                        <>
                            <div className="filters-container mb-3">
                                <div className="row g-3 align-items-center">
                                    <div className="col-md-2">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Project Name"
                                            name="projectName"
                                            value={filters.projectName}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Contact Person"
                                            name="contactPerson"
                                            value={filters.contactPerson}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="Email"
                                            name="email"
                                            value={filters.email}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label mb-0">Agreement Date</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="agreementDate"
                                            value={filters.agreementDate}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label mb-0">Billing Date</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="billingDate"
                                            value={filters.billingDate}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                {filteredProjects.map(project => (
                                    <div key={project._id} className="col-md-4 mb-3">
                                        <div className="card h-100">
                                            <div className="card-body">
                                                <h5 className="card-title">{project.projectId} - {project.projectName}</h5>
                                                {project.URL && <p className="text-muted mb-2"><a href={project.URL} target="_blank" rel="noopener noreferrer">{project.URL}</a></p>}
                                                <div className="card-text">
                                                    <p><strong>Contact Person:</strong> {project.contactPerson}</p>
                                                    <p><strong>Email:</strong> {project.email}</p>
                                                    <p><strong>Phone:</strong> {project.phone}</p>
                                                    <p><strong>Agreement Date:</strong> {project.agreementDate ? new Date(project.agreementDate).toLocaleDateString() : 'Not set'}</p>
                                                    <p><strong>Billing Date:</strong> {project.billingDate ? new Date(project.billingDate).toLocaleDateString() : 'Not set'}</p>
                                                    <p><strong>Bill Amount:</strong> {project.billAmount !== undefined && project.billAmount !== null ? `Rs. ${project.billAmount.toFixed(2)}` : 'Not set'}</p>
                                                    {project.billImage && project.billImage.fileName && (
                                                        <p><strong>Bill Image:</strong> <a href="#" onClick={(e) => { e.preventDefault(); handleViewBillImage(project._id); }} style={{ cursor: 'pointer', textDecoration: 'underline', color: 'blue' }}>{project.billImage.fileName}</a></p>
                                                    )}
                                                </div>
                                                <div className="mt-3">
                                                    <button
                                                        className="btn btn-success btn-sm me-2"
                                                        onClick={() => handleViewDocs(project)}
                                                    >
                                                        View Documents
                                                    </button>
                                                    <button 
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleEdit(project._id)}
                                                    >
                                                        Edit Project
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Documents Modal */}
                            {selectedProject && (
                                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                    <div className="modal-dialog modal-lg">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h5 className="modal-title">Documents - {selectedProject.projectName}</h5>
                                                <button type="button" className="btn-close" onClick={handleCloseDocs}></button>
                                            </div>
                                            <div className="modal-body">
                                                {selectedProject.projectDocs && selectedProject.projectDocs.length > 0 ? (
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
                                                                {selectedProject.projectDocs.map((doc) => (
                                                                    <tr key={doc._id}>
                                                                        <td>{doc.fileName}</td>
                                                                        <td>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                                                                        <td>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-primary"
                                                                                onClick={() => handleDownloadDoc(selectedProject._id, doc._id, doc.fileName)}
                                                                            >
                                                                                Download
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <p>No documents available for this project.</p>
                                                )}
                                            </div>
                                            <div className="modal-footer">
                                                <button type="button" className="btn btn-secondary" onClick={handleCloseDocs}>Close</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <p>No projects available.</p>
                    )}
                </div>
            ) : (
                <NotAuthorized />
            )}
        </div>
    );
};

export default Projects;
