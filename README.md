# Office Automation System (OAS)

A full-stack web application for managing office tasks, projects, notices, and reports.  
Built with **React** (frontend) and **Node.js/Express + MongoDB** (backend).

---

## Table of Contents

- [Features](#features)
- [Demo Login Credentials](#demo-login-credentials)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Usage](#usage)
- [License](#license)

---

## Features

- **User Authentication** (JWT-based)
- **Role-based Access**: User & Manager
- **Task Management**: Assign, track, and update tasks with priorities and deadlines
- **Project Management**: Track projects, upload documents, manage billing
- **Notice Board**: Post and view notices with file attachments
- **Reports & Analytics**: Visualize task/project stats with charts
- **File Uploads**: Attach files to tasks, projects, and notices
- **Responsive UI**: Built with React and modern CSS

---

## Demo Login Credentials

Use these demo accounts to log in:

| Name         | Email                | Password   | Phone       | Type    |
|--------------|----------------------|------------|-------------|---------|
| Demo User    | user1@example.com    | password1  | 9000000001  | User    |
| Demo Manager | manager1@example.com | password2  | 9000000002  | Manager |

> **Note:** Make sure these users exist in your database. See [Backend Setup](#backend-setup) for instructions.

---

## Screenshots

> _Add screenshots of your app here for a better README!_

---

## Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **npm** (v9+ recommended)
- **MongoDB** (local or cloud)

---

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure MongoDB:**
   - By default, connects to `mongodb://localhost:27017/OAS` (see `backend/db.js`).
   - Make sure MongoDB is running locally, or update the connection string as needed.

3. **Start the backend server:**
   ```bash
   npm run start
   ```
   - The backend runs on **http://localhost:5000**

4. **Create Demo Users:**
   - Use the `/api/auth/createuser` endpoint (see [API Endpoints](#api-endpoints)) or insert users directly into MongoDB with the credentials above.

---

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```
   - The frontend runs on **http://localhost:5173** (default Vite port)

3. **Full-stack development:**
   - You can run both frontend and backend together:
     ```bash
     npm run both
     ```

---

## Project Structure

```
OAS/
  backend/         # Express.js backend (API, models, routes)
  src/             # React frontend (components, context, assets)
  public/          # Static assets
  uploads/         # Uploaded files (projects, tasks, notices)
  notices/         # Notice attachments
  task-attachments/# Task attachments
  README.md        # This file
  package.json     # Frontend config
  backend/package.json # Backend config
```

---

## API Endpoints

### Auth

- `POST /api/auth/createuser` — Register a new user
- `POST /api/auth/login` — Login and receive JWT
- `POST /api/auth/getuser` — Get current user info (JWT required)
- `GET /api/auth/getalluser` — Get all users (Manager only)
- `GET /api/auth/getuserbyid/:id` — Get user by ID (Manager or self)

### Tasks

- `GET /api/task/gettasks` — Get all tasks
- `GET /api/task/my-tasks` — Get tasks assigned to current user
- `GET /api/task/assigned-tasks` — Get tasks assigned by current user (Manager)
- `PUT /api/task/updatestatus/:id` — Update task status

### Projects

- `GET /api/projects/getprojects` — Get all projects
- `POST /api/projects` — Create a new project
- `PUT /api/projects/:id` — Update a project
- `GET /api/projects/:id/bill-image` — Get bill image for a project

### Notices

- `GET /api/notice/getnotices` — Get all notices
- `POST /api/notice` — Create a new notice (Manager only)

> _See backend routes for more endpoints and details._

---

## Usage

- **Login** with the demo credentials above.
- **Manager** can add/edit users, tasks, projects, and notices.
- **User** can view and update their assigned tasks, view projects and notices.
- **Reports**: Visualize task and project statistics with interactive charts.

---

## License

This project is licensed under the ISC License.

---

**For any issues or contributions, please open an issue or pull request!**
