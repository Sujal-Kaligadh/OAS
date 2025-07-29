import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import alertContext from '../../context/alert/alertContext';

function Users() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    type: 'User' // Set default to match radio button
  });
  
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { showAlert } = useContext(alertContext); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.name || !formData.phone || !formData.email || !formData.password) {
      const errorMsg = 'Please fill in all required fields.';
      setError(errorMsg);
      showAlert(errorMsg, "danger");
      return; // Stop submission
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/createuser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          type: formData.type,
        }),
      });

      // Try to parse JSON response regardless of status code
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        const errorMsg = 'Could not parse server response';
        setError(errorMsg);
        showAlert(errorMsg, "danger");
        return;
      }

      if (response.ok) {
        console.log('User created successfully', data);
        setSuccess(true);
        showAlert("User created successfully", "success");
        setFormData({
          name: '',
          phone: '',
          email: '',
          password: '',
          type: 'User',
        });
        navigate('/users');
      } else {
        // Handle error responses
        console.error('Failed to create user:', data);
        let errorMsg = 'Failed to create user. Please try again.';
        
        if (data.errors && Array.isArray(data.errors)) {
          // Handle validation errors from express-validator
          errorMsg = data.errors.map(err => err.msg).join(', ');
        } else if (data.error) {
          // Handle custom error messages
          errorMsg = data.error;
        }
        
        setError(errorMsg);
        showAlert(errorMsg, "danger");
      }
    } catch (error) {
      console.error('Error during user creation:', error);
      const errorMsg = 'Network error. Please check your connection and try again.';
      setError(errorMsg);
      showAlert(errorMsg, "danger");
    }
  };

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  return (
    <div className="container my-3">
      <h2>+ Add Users</h2>
      
      <form className="node-forms" style={{width:'40%'}} onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="input-name" className="form-label">Full Name</label>
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
                <label htmlFor="InputPhone" className="form-label">Phone</label>
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
                <label htmlFor="InputEmail" className="form-label">Email address</label>
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
            <div className="mb-3">
                <label htmlFor="InputPassword" className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  onChange={handleChange}
                  value={formData.password} 
                  name="password" 
                  id="InputPassword"
                  required
                  minLength="5"
                />
                <small className="form-text text-muted">Must be at least 5 characters</small>
            </div>
            <div className="mb-3">
                <label className="form-label d-block">User Type</label>
                <div className="form-check form-check-inline">
                    <input 
                      type="radio" 
                      className="form-check-input" 
                      id="typeUser" 
                      name="type" 
                      onChange={handleChange} 
                      checked={formData.type === "User"}
                      value="User" 
                      required
                    />
                    <label className="form-check-label" htmlFor="typeUser">User</label>
                </div>
                <div className="form-check form-check-inline">
                    <input 
                      type="radio" 
                      className="form-check-input" 
                      id="typeManager" 
                      name="type" 
                      onChange={handleChange} 
                      checked={formData.type === "Manager"}
                      value="Manager" 
                    />
                    <label className="form-check-label" htmlFor="typeManager">Manager</label>
                </div>
            </div>
            <button type="submit" className="btn btn-primary">Submit</button>
        </form>
    </div>
  );
}

export default Users;