import { BrowserRouter, Routes, Route } from "react-router"; 
import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { useContext } from "react";
// import { useNavigate } from 'react-router-dom'; 

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Tasks from "./components/Tasks";
import Notices from "./components/Notices";
import Reports from "./components/Reports";
import Alert from "./components/Alert";
import GetUser from "./components/GetUser";
import Users from "./components/Users";
import Profile from "./components/Profile";
import AddUsers from "./components/node/AddUsers";
import UpdateNotices from "./components/node/update/UpdateNotices";
import AssignedTasks from "./components/AssignedTasks";
import AlertState from "./context/alert/alertState";
import alertContext from "./context/alert/alertContext";
import UpdateUsers from "./components/node/update/UpdateUsers";

import authContext from "./context/auth/authContext";
import AuthState from "./context/auth/authState"
import AddNotice from "./components/node/AddNotice";
import AddTask from "./components/node/AddTask";    
import MyTasks from "./components/MyTasks";
import UpdateTasks from "./components/node/update/UpdateTasks";
import AddProjects from "./components/node/AddProjects";
import Projects from "./components/Projects";
import UpdateProjects from "./components/node/update/UpdateProjects";
import Documents from "./components/Documents";
import AddDocuments from "./components/node/AddDocuments";

function AppContent() {
  const location = useLocation();
  const [nodeAddPage, setNodeAddPage] = useState(false);
  const { authToken, loggedIn } = useContext(authContext);

  useEffect(() => {
    if (location.pathname.includes("/node/")) {
      setNodeAddPage(true);
    } else {
      setNodeAddPage(false);
    }
  }, [location]);

  return (
    <>
      <Navbar />
      <Alert />

      {loggedIn && authToken && !nodeAddPage && (
        <div style={{ padding: "10px", textAlign: "center" }}>
          <GetUser />
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<Users />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/node/add/users" element={<AddUsers />} />
        <Route path="/node/update/users/:id" element={<UpdateUsers />} />
        <Route path="/node/add/tasks" element={<AddTask />} />
        <Route path="/node/edit/tasks/:id" element={<UpdateTasks />} />
        <Route path="/node/add/notices" element={<AddNotice />} />
        <Route path="/node/edit/notices/:id" element={<UpdateNotices />} />
        <Route path="/node/add/projects" element={<AddProjects />} />
        <Route path="/node/edit/projects/:id" element={<UpdateProjects />} />
        <Route path="/node/add/documents" element={<AddDocuments />} />
        <Route path="/assigned-tasks" element={<AssignedTasks />} />
        <Route path="/my-tasks" element={<MyTasks />} />
        <Route path="/projects" element={<Projects />} />
      </Routes>

      <Footer />
    </>
  );
}



function App() {
  return (
    <BrowserRouter>
      <AuthState>
        <AlertState>
          <AppContent />
        </AlertState>
      </AuthState>
    </BrowserRouter>
  );
}

export default App;