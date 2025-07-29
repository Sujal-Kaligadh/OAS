import { useState } from "react";
import alertContext from "./alertContext";

const AlertState = (props) => {
  const [alert, setAlert] = useState(null);

  // Show alert
  const showAlert = (message, type) => {
    setAlert({
      message,
      type
    });
    window.scrollTo(0, 0);
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setAlert(null);
    }, 3000);
  };

  return (
    <alertContext.Provider value={{
      alert: alert,
      showAlert
    }}>
      {props.children}
    </alertContext.Provider>
  );
}

export default AlertState;