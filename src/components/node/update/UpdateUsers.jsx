import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import alertContext from '../../../context/alert/alertContext';
import Loading from '../../Loading';

function UpdateUsers() {
  const isLoggedIn = localStorage.getItem("authToken") !== null;
  let authToken = null;

  if (isLoggedIn) {
    authToken = localStorage.getItem("authToken");
  }

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    type: 'User',
  });

  const navigate = useNavigate();
  const { id } = useParams();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useContext(alertContext);

  useEffect(() => {
    if (id) {
      fetchUserData(id);
    }
  }, [id]);

  const fetchUserData = async (userId) => {
    try {
      setLoading(true);

      // Direct API call to get user by ID
      const response = await fetch(`http://localhost:5000/api/auth/getuserbyid/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': authToken,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();

      // Populate form with user data
      setFormData({
        name: userData.name || '',
        phone: userData.phone || '',
        email: userData.email || '',
        password: '', // Don't populate password for security reasons
        type: userData.type || 'User',
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      showAlert('Error fetching user data. Please try again.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate input
    const validationErrors = [];
    if (!formData.name || formData.name.length < 3) {
      validationErrors.push('Name must be at least 3 characters long');
    }
    if (!formData.phone) {
      validationErrors.push('Phone number is required');
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      validationErrors.push('Invalid email address');
    }
    if (!id && (!formData.password || formData.password.length < 5)) {
      validationErrors.push('Password must be at least 5 characters long');
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      showAlert(validationErrors.join(', '), 'danger');
      setLoading(false);
      return;
    }

    try {
      const url = `http://localhost:5000/api/auth/updateuser/${id}`;
      const method = 'PUT';
      // Prepare request body - only include password if it's provided
      const body = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        type: formData.type
      };

      // Only add password if it's provided (for update)
      if (formData.password && formData.password.length >= 5) {
        body.password = formData.password;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'auth-token': authToken, // Use the correct auth token
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        showAlert('User updated successfully', 'success');
        navigate('/users');
      } else {
        const errorMsg = data.error || 'Failed to update user.';
        setError(errorMsg);
        showAlert(errorMsg, 'danger');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMsg = 'Network error. Please check your connection and try again.';
      setError(errorMsg);
      showAlert(errorMsg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);

      // Confirm before deleting
      if (!window.confirm("Are you sure you want to delete this user?")) {
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/auth/deleteuser/${id}`, {
        method: 'DELETE', // This needs to be a string, not a variable
        headers: {
          'Content-Type': 'application/json',
          'auth-token': authToken
        }
        // DELETE requests typically don't need a body
      });

      const data = await response.json();
      if (response.ok) {
        showAlert('User deleted successfully', 'success');
        navigate('/users');
      } else {
        const errorMsg = data.error || 'Failed to delete user.';
        setError(errorMsg);
        showAlert(errorMsg, 'danger');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMsg = 'Network error. Please check your connection and try again.';
      setError(errorMsg);
      showAlert(errorMsg, 'danger');
    } finally {
      setLoading(false);
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container my-3">
      <h2>Update User</h2>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading && !error && (
        <div className="alert alert-info" role="alert">
          Loading user data...
        </div>
      )}

      <form className="node-forms" style={{ width: '40%' }} onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="input-name" className="form-label">
            Full Name
          </label>
          <input
            type="text"
            className="form-control"
            onChange={handleChange}
            value={formData.name}
            name="name"
            id="input-name"
            required
            minLength="3"
          />
          <small className="form-text text-muted">Must be at least 3 characters</small>
        </div>
        <div className="mb-3">
          <label htmlFor="InputPhone" className="form-label">
            Phone
          </label>
          <input
            type="tel"
            className="form-control"
            onChange={handleChange}
            value={formData.phone}
            name="phone"
            id="InputPhone"
            required
          />
          <small className="form-text text-muted">Enter a valid phone number</small>
        </div>
        <div className="mb-3">
          <label htmlFor="InputEmail" className="form-label">
            Email address
          </label>
          <input
            type="email"
            className="form-control"
            id="InputEmail"
            onChange={handleChange}
            value={formData.email}
            name="email"
            aria-describedby="emailHelp"
            required
          />
        </div>
        {/* Password field is optional for updates */}
        <div className="mb-3">
          <label htmlFor="InputPassword" className="form-label">
            Password {id && <span className="text-muted">(Leave blank to keep current password)</span>}
          </label>
          <input
            type="password"
            className="form-control"
            onChange={handleChange}
            value={formData.password}
            name="password"
            id="InputPassword"
            required={!id}
            minLength="5"
          />
          <small className="form-text text-muted">Must be at least 5 characters</small>
        </div>
        <div className="mb-3">
          <label className="form-label d-block">
            User Type
          </label>
          <div className="form-check form-check-inline">
            <input
              type="radio"
              className="form-check-input"
              id="typeUser"
              name="type"
              onChange={handleChange}
              checked={formData.type === 'User'}
              value="User"
              required
            />
            <label className="form-check-label" htmlFor="typeUser">
              User
            </label>
          </div>
          <div className="form-check form-check-inline">
            <input
              type="radio"
              className="form-check-input"
              id="typeManager"
              name="type"
              onChange={handleChange}
              checked={formData.type === 'Manager'}
              value="Manager"
            />
            <label className="form-check-label" htmlFor="typeManager">
              Manager
            </label>
          </div>
        </div>
        {loading ? <Loading/> :
          (
            <div><button
              type="submit"
              className="btn btn-primary me-3"
              disabled={loading}
            >

              Update
            </button>

              <button
                type="button"
                className="btn btn-danger"
                disabled={loading}
                onClick={handleDelete}
              >

                Delete
              </button>
            </div>)
        }
      </form>
    </div>
  );
}

export default UpdateUsers;