import React, { useContext } from "react";
import alertContext from "../context/alert/alertContext";

function Alert() {
    const { alert } = useContext(alertContext);
    
    return (
        <div id="alert-wrapper">
            {alert?.message && (
                <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
                    {alert.message}
                </div>
            )}
        </div>
    );
}

export default Alert;