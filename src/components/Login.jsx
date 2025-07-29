// Login.jsx (refactored)
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import alertContext from '../context/alert/alertContext';
import authContext from '../context/auth/authContext';

function Login() {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({email:"", password:""});
    const { showAlert } = useContext(alertContext);
    const { login } = useContext(authContext);
 
    const handleLogin = async (e) => {
        e.preventDefault();
        
        const result = await login(credentials.email, credentials.password);
        
        if(result.success) {
            navigate('/');
            showAlert("Login Successful.", "success");
        } else {
            showAlert("Please enter correct credentials.", "danger");
        }
    };

    const onChange = (e) => {
        setCredentials({...credentials, [e.target.name]: e.target.value});
    };

    return (
        <div id="login-block">
            <h3 className="text-center">Login</h3>
            <form onSubmit={handleLogin}>
                <div className="mb-3">
                    <label htmlFor="InputEmail1" className="form-label">Email address</label>
                    <input type="email" className="form-control" name="email" onChange={onChange} value={credentials.email} id="InputEmail1" aria-describedby="emailHelp" />
                </div>
                <div className="mb-3">
                    <label htmlFor="InputPassword1" className="form-label">Password</label>
                    <input type="password" className="form-control" name="password" onChange={onChange} value={credentials.password} id="InputPassword1" />
                </div>
                <button type="submit" className="btn btn-primary">Login</button>
            </form>
        </div>
    );
}

export default Login;