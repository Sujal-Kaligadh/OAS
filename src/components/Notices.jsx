import React, { useContext, useEffect, useState } from 'react';
import NotAuthorized from './NotAuthorized';
import authContext from '../context/auth/authContext';
import alertContext from '../context/alert/alertContext';
import AddBtn from './AddBtn';
import Loading from './Loading';
import { Link } from 'react-router';
import viewFileIcon from '../assets/viewfile.png';

function Notices() {
    const { loggedIn, userType, authToken } = useContext(authContext);
    const { showAlert } = useContext(alertContext);
    const [loading, setLoading] = useState(true);
    const [notices, setNotices] = useState([]);
    const [filters, setFilters] = useState({
        title: '',
        date: ''
    });

    useEffect(() => {
        const fetchNotices = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/notice/getnotices",
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

                let noticeData = await response.json();
                setNotices(noticeData);
                setLoading(false);
            }
            catch (error) {
                console.error("Error fetching notices:", error);
                setLoading(false);
            }
        }

        fetchNotices();
    }, [authToken]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const filteredNotices = notices.filter(notice => {
        const titleMatch = notice.title.toLowerCase().includes(filters.title.toLowerCase());
        const dateMatch = filters.date ? 
            new Date(notice.publishedDate).toLocaleDateString() === new Date(filters.date).toLocaleDateString() 
            : true;
        return titleMatch && dateMatch;
    }).sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));

    return (
        <div className="container my-3">
            {loggedIn ? (
                <div>
                    {userType !== 'User' && <AddBtn btntext="Notice" link="/node/add/notices" />}
                    
                    <p>Total Notices: {filteredNotices.length}</p>
                    {loading && <Loading />}

                    {!loading && notices.length === 0 && <p className="text-center">No notices found</p>}

                    {notices.length > 0 && (
                        <>
                            <div className="filters-container mb-3">
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Filter by title..."
                                            name="title"
                                            value={filters.title}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="date"
                                            value={filters.date}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <table>
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Description</th>
                                        <th>File</th>
                                        <th>Published Date</th>
                                        <th>Manage</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredNotices.map((notice) => (
                                        <tr key={notice._id}>
                                            <td>{notice.title}</td>
                                            <td>{notice.description}</td>
                                            <td>
                                                {notice.file && (
                                                    <a href={`http://localhost:5000${notice.file}`} target="_blank" rel="noopener noreferrer">
                                                        <img height={"40px"} src={viewFileIcon} alt="view_file" />
                                                    </a>
                                                )}
                                            </td>
                                            <td>{new Date(notice.publishedDate).toLocaleDateString()}</td>
                                            <td>
                                                {userType !== 'User' && (
                                                    <Link to={`/node/edit/notices/${notice._id}`}><button className="btn btn-sm btn-secondary mx-1">Edit</button></Link>
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

export default Notices;