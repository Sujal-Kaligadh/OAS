import React, { useState, useEffect } from "react";
import Loading from "./Loading";

function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const getUser = async () => {
        try {
            const authToken = localStorage.getItem("authToken"); // Retrieve token from localStorage
            if (!authToken) {
                console.log("No auth token found");
                setLoading(false);
                return;
            }

            const response = await fetch("http://localhost:5000/api/auth/getuser", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "auth-token": authToken,
                },
            });

            const json = await response.json();
            // console.log(json);
            if (response.ok) {
                setUser(json); // Store user data in state
            } else {
                console.error("Error fetching user:", json.error);
            }
        } catch (error) {
            console.error("Error:", error);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getUser();
    }, []);

    return (
        <div className="container">
            {loading ? <Loading /> : <div>
                Name: {user.name} <br />
                Email: {user.email} <br />
                Phone: {user.phone} <br />
            </div>}

        </div>
    )
}

export default Profile
