import React, { useEffect, useState, useContext } from 'react';
import AddBtn from './AddBtn';
import NotAuthorized from './NotAuthorized';
import { Link } from 'react-router';
import authContext from '../context/auth/authContext';
import Loading from './Loading';

function Users() {
    const { loggedIn, userType, authToken } = useContext(authContext);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({
        name: '',
        email: '',
        phone: '',
        type: ''
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/auth/getalluser", {
                    method: "GET",
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': authToken,
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const userData = await response.json();
                setUsers(userData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching users:", error);
                setLoading(false);
            }
        };

        if (authToken) {
            fetchUsers();
        }
    }, [authToken]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const filteredUsers = users.filter(user => {
        return (
            user.name.toLowerCase().includes(filters.name.toLowerCase()) &&
            user.email.toLowerCase().includes(filters.email.toLowerCase()) &&
            String(user.phone).toLowerCase().includes(filters.phone.toLowerCase()) &&
            (filters.type === '' || user.type === filters.type)
        );
    });

    return (
        <div className="container my-3">
            {loggedIn ? (
                <div>
                    {userType !== 'User' && <AddBtn btntext="Users" link="/node/add/users" />}

                    {loading && <Loading />}

                    {!loading && users.length === 0 && <p className="text-center">No users found</p>}

                    {users.length > 0 && (
                        <>
                            <div className="filters-container mb-3">
                                <div className="row g-3">
                                    <div className="col-md-3">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Filter by Name"
                                            name="name"
                                            value={filters.name}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Filter by Email"
                                            name="email"
                                            value={filters.email}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Filter by Phone"
                                            name="phone"
                                            value={filters.phone}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <select
                                            className="form-select"
                                            name="type"
                                            value={filters.type}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="">All Types</option>
                                            <option value="User">User</option>
                                            <option value="Manager">Manager</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Type</th>
                                        <th>Manage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id}>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>
                                            <td>{user.phone}</td>
                                            <td>{user.type}</td>
                                            <td>
                                                {userType !== 'User' && (
                                                    <Link to={`/node/update/users/${user._id}`}>
                                                        <button className="btn btn-sm btn-secondary mx-1">Edit</button>
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            ) : (
                <NotAuthorized />
            )}
        </div>
    );
}

export default Users;