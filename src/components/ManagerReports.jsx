import React from 'react'
import NotAuthorized from './NotAuthorized';
import authContext from '../context/auth/authContext';
import alertContext from '../context/alert/alertContext';
import { useState, useContext, useEffect } from 'react';
import Loading from './Loading';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
  Filler
);

function ManagerReports() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const months = [
    { value: 'all', label: 'All Months' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' }
  ];

  const { loggedIn, userType, authToken, user } = useContext(authContext);
  const { showAlert } = useContext(alertContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalCompletedTasks, setTotalCompletedTasks] = useState(0);
  const [totalPendingTasks, setTotalPendingTasks] = useState(0);
  const [totalInProgressTasks, setTotalInProgressTasks] = useState(0);
  const [totalOverdueTasks, setTotalOverdueTasks] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedUserYear, setSelectedUserYear] = useState(currentYear.toString());
  const [selectedUserMonth, setSelectedUserMonth] = useState('all');
  const [selectedMonthlyYear, setSelectedMonthlyYear] = useState(currentYear.toString());
  const [availableYears, setAvailableYears] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [userCompletedTasks, setUserCompletedTasks] = useState({});
  const [userOverdueTasks, setUserOverdueTasks] = useState({});
  const [monthlyCompletedTasks, setMonthlyCompletedTasks] = useState(Array(12).fill(0));

  const chartData = {
    labels: ['Total', 'Completed', 'In Progress', 'Pending', 'Overdue'],
    datasets: [
      {
        label: 'Tasks',
        data: [
          totalTasks,
          totalCompletedTasks,
          totalInProgressTasks,
          totalPendingTasks,
          totalOverdueTasks
        ],
        backgroundColor: [
          'rgba(13, 110, 253, 0.7)',  
          'rgba(25, 135, 84, 0.7)',   
          'rgba(13, 202, 240, 0.7)',  
          'rgba(255, 193, 7, 0.7)',   
          'rgba(220, 53, 69, 0.7)',  
        ],
        borderColor: [
          'rgb(13, 110, 253)',
          'rgb(25, 135, 84)',
          'rgb(13, 202, 240)',
          'rgb(255, 193, 7)',
          'rgb(220, 53, 69)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Task Statistics',
        font: {
          size: 16
        },
        padding: {
          bottom: 50
        }
      },
      datalabels: {
        color: '#000',
        anchor: 'end',
        align: 'top',
        formatter: function(value) {
          return value;
        },
        font: {
          weight: 'bold',
          size: 14
        },
        padding: {
          top: 10
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const userChartData = {
    labels: Object.entries(userCompletedTasks)
      .sort(([, a], [, b]) => b - a) 
      .map(([userId]) => userMap[userId] || 'Unknown User'),
    datasets: [
      {
        label: 'Completed Tasks',
        data: Object.entries(userCompletedTasks)
          .sort(([, a], [, b]) => b - a)
          .map(([, count]) => count),
        backgroundColor: 'rgba(25, 135, 84, 0.7)',  // Success color
        borderColor: 'rgb(25, 135, 84)',
        borderWidth: 1,
      },
      {
        label: 'Overdue Tasks',
        data: Object.entries(userCompletedTasks)
          .sort(([, a], [, b]) => b - a)
          .map(([userId]) => userOverdueTasks[userId] || 0),
        backgroundColor: 'rgba(220, 53, 69, 0.7)',  // Danger color
        borderColor: 'rgb(220, 53, 69)',
        borderWidth: 1,
      }
    ],
  };

  const userChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      },
      title: {
        display: true,
        text: `Tasks by User (${selectedUserYear}${selectedUserMonth !== 'all' ? ` - ${months[parseInt(selectedUserMonth) + 1].label}` : ''})`,
        font: {
          size: 16
        },
        padding: {
          bottom: 50
        }
      },
      datalabels: {
        color: '#000',
        anchor: 'end',
        align: 'top',
        offset: 5,
        formatter: function(value) {
          return value;
        },
        font: {
          weight: 'bold',
          size: 14
        },
        padding: {
          top: 10
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    layout: {
      padding: {
        // Removed top padding
      }
    }
  };

  const monthlyChartData = {
    labels: months.slice(1).map(month => month.label), // Remove 'All Months' option
    datasets: [
      {
        label: 'Completed Tasks',
        data: monthlyCompletedTasks,
        borderColor: 'rgb(25, 135, 84)',
        backgroundColor: 'rgba(25, 135, 84, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const monthlyChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: `Monthly Completed Tasks Trend (${selectedMonthlyYear})`,
        font: {
          size: 16
        },
        padding: {
          bottom: 50
        }
      },
      datalabels: {
        color: '#000',
        anchor: 'end',
        align: 'top',
        formatter: function(value) {
          return value;
        },
        font: {
          weight: 'bold',
          size: 14
        },
        padding: {
          top: 10
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/getalluser', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'auth-token': authToken
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const users = await response.json();
        const userMap = {};
        // Only include users with type "User"
        users.filter(user => user.type === "User").forEach(user => {
          userMap[user._id] = user.name;
        });
        setUserMap(userMap);
      } catch (error) {
        console.error('Error fetching users:', error);
        showAlert('Error fetching users', 'danger');
      }
    };

    const fetchTasks = async () => {
      try {
        if (!authToken) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        // Fetch all tasks without any date filtering
        const response = await fetch('http://localhost:5000/api/task/gettasks', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'auth-token': authToken
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch tasks');
        }

        const data = await response.json();
        setTasks(data);

        const uniqueRecipients = [...new Set(data.map(task => task.recipient))];
        setRecipients(uniqueRecipients);

        const years = [...new Set(data.map(task => new Date(task.createdAt).getFullYear()))];
        years.sort((a, b) => b - a); 
        setAvailableYears(years);

        if (!years.includes(currentYear)) {
          years.unshift(currentYear);
        }

        const mostRecentYear = years[0].toString();
        setSelectedYear(mostRecentYear);
        setSelectedUserYear(mostRecentYear);
        setSelectedMonthlyYear(mostRecentYear);

        updateTaskCounts(data, selectedRecipient, selectedMonth, mostRecentYear);
        updateMonthlyCompletedTasks(data, mostRecentYear);

      }
      catch (error) {
        console.error('Error fetching tasks:', error);
        setError(error.message || 'Failed to fetch tasks');
        showAlert(error.message || 'Error fetching tasks', 'danger');
      } finally {
        setLoading(false);
      }
    }

    if (loggedIn && authToken) {
      fetchUsers();
      fetchTasks();
    }
  }, [authToken, loggedIn, showAlert]);

  useEffect(() => {
    if (Object.keys(userMap).length > 0 && tasks.length > 0) {
      updateUserCompletedTasks(tasks, selectedUserMonth, selectedUserYear);
    }
  }, [userMap, tasks, selectedUserMonth, selectedUserYear]);

  const updateUserCompletedTasks = (taskData, month, year) => {
    let filteredTasks = taskData;

    // Filter by year
    filteredTasks = filteredTasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return taskDate.getFullYear() === parseInt(year);
    });

    // Filter by month if selected
    if (month !== 'all') {
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate.getMonth() === parseInt(month);
      });
    }

    // Initialize tasks for all users with 0
    const completedTasksByUser = {};
    const overdueTasksByUser = {};
    Object.keys(userMap).forEach(userId => {
      completedTasksByUser[userId] = 0;
      overdueTasksByUser[userId] = 0;
    });

    // Count completed and overdue tasks for each user
    filteredTasks.forEach(task => {
      if (task.recipient in completedTasksByUser) {
        if (task.status === "Completed") {
          completedTasksByUser[task.recipient]++;
        } else if (task.status === "Overdue") {
          overdueTasksByUser[task.recipient]++;
        }
      }
    });

    setUserCompletedTasks(completedTasksByUser);
    setUserOverdueTasks(overdueTasksByUser);
  };

  const updateTaskCounts = (taskData, recipient, month, year) => {
    let filteredTasks = taskData;

    // Filter by recipient
    if (recipient !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.recipient === recipient);
    }

    // Filter by year
    filteredTasks = filteredTasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return taskDate.getFullYear() === parseInt(year);
    });

    // Filter by month
    if (month !== 'all') {
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate.getMonth() === parseInt(month);
      });
    }

    const total_tasks = filteredTasks.length;
    let total_overdue_tasks = 0;
    let total_pending_tasks = 0;
    let total_in_progress_tasks = 0;
    let total_completed_tasks = 0;

    filteredTasks.forEach(task => {
      if (task.status === "Pending") {
        total_pending_tasks++;
      }
      else if (task.status === "In Progress") {
        total_in_progress_tasks++;
      }
      else if (task.status === "Overdue") {
        total_overdue_tasks++;
      }
      else if (task.status === "Completed") {
        total_completed_tasks++;
      }
    });

    setTotalTasks(total_tasks);
    setTotalCompletedTasks(total_completed_tasks);
    setTotalPendingTasks(total_pending_tasks);
    setTotalInProgressTasks(total_in_progress_tasks);
    setTotalOverdueTasks(total_overdue_tasks);
  };

  const updateMonthlyCompletedTasks = (taskData, year) => {
    const monthlyCounts = Array(12).fill(0);
    
    taskData.forEach(task => {
      if (task.status === "Completed") {
        const taskDate = new Date(task.createdAt);
        if (taskDate.getFullYear() === parseInt(year)) {
          monthlyCounts[taskDate.getMonth()]++;
        }
      }
    });

    setMonthlyCompletedTasks(monthlyCounts);
  };

  const handleRecipientChange = (e) => {
    const recipient = e.target.value;
    setSelectedRecipient(recipient);
    updateTaskCounts(tasks, recipient, selectedMonth, selectedYear);
  };

  const handleMonthChange = (e) => {
    const month = e.target.value;
    setSelectedMonth(month);
    updateTaskCounts(tasks, selectedRecipient, month, selectedYear);
    updateUserCompletedTasks(tasks, month, selectedYear);
  };

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    updateTaskCounts(tasks, selectedRecipient, selectedMonth, year);
    updateUserCompletedTasks(tasks, selectedMonth, year);
    updateMonthlyCompletedTasks(tasks, year);
  };

  const handleUserYearChange = (e) => {
    const year = e.target.value;
    setSelectedUserYear(year);
    updateUserCompletedTasks(tasks, selectedUserMonth, year);
  };

  const handleUserMonthChange = (e) => {
    const month = e.target.value;
    setSelectedUserMonth(month);
    updateUserCompletedTasks(tasks, month, selectedUserYear);
  };

  const handleMonthlyYearChange = (e) => {
    const year = e.target.value;
    setSelectedMonthlyYear(year);
    updateMonthlyCompletedTasks(tasks, year);
  };

  return (
    <div>
      {loggedIn ? (
        <div>
          {userType === "Manager" && (
            <>
              <div className="container text-center my-3">
                <div className="row mb-3">
                  <div className="col-md-6 mx-auto">
                    <div className="row">
                      <div className="col">
                        <select 
                          className="form-select" 
                          value={selectedRecipient} 
                          onChange={handleRecipientChange}
                        >
                          <option value="all">All Recipients</option>
                          {recipients.map((recipientId, index) => (
                            <option key={index} value={recipientId}>
                              {userMap[recipientId] || 'Unknown User'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col">
                        <select 
                          className="form-select" 
                          value={selectedYear} 
                          onChange={handleYearChange}
                        >
                          {availableYears.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col">
                        <select 
                          className="form-select" 
                          value={selectedMonth} 
                          onChange={handleMonthChange}
                        >
                          {months.map((month) => (
                            <option key={month.value} value={month.value}>
                              {month.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col">
                    <div className="card bg-primary p-2">
                      <div className="card-title text-white fw-bold fs-5">{totalTasks} <br/>Total Tasks</div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="card bg-success p-2">
                      <div className="card-title text-white fw-bold fs-5">{totalCompletedTasks} <br/>Completed Tasks</div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="card bg-info p-2">
                      <div className="card-title text-white fw-bold fs-5">{totalInProgressTasks} <br/>In Progress Tasks</div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="card bg-warning p-2">
                      <div className="card-title text-white fw-bold fs-5">{totalPendingTasks} <br/>Pending Tasks</div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="card bg-danger p-2">
                      <div className="card-title text-white fw-bold fs-5">{totalOverdueTasks} <br/>Overdue Tasks</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Status Bar Graph */}
              <div className="container mt-5">
                <div className="row">
                  <div className="col-md-8 mx-auto">
                    <div className="card">
                      <div className="card-body">
                        <Bar data={chartData} options={chartOptions} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Completed Tasks Bar Graph */}
              <div className="container mt-5">
                <div className="row">
                  <div className="col-md-8 mx-auto">
                    <div className="card">
                      <div className="card-body">
                        <div className="row mb-3">
                          <div className="col-md-6 mx-auto">
                            <div className="row">
                              <div className="col">
                                <select 
                                  className="form-select" 
                                  value={selectedUserYear} 
                                  onChange={handleUserYearChange}
                                >
                                  {availableYears.map((year) => (
                                    <option key={year} value={year}>
                                      {year}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col">
                                <select 
                                  className="form-select" 
                                  value={selectedUserMonth} 
                                  onChange={handleUserMonthChange}
                                >
                                  {months.map((month) => (
                                    <option key={month.value} value={month.value}>
                                      {month.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Bar data={userChartData} options={userChartOptions} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Completed Tasks Line Graph */}
              <div className="container mt-5">
                <div className="row">
                  <div className="col-md-8 mx-auto">
                    <div className="card">
                      <div className="card-body">
                        <div className="row mb-3">
                          <div className="col-md-4 mx-auto">
                            <select 
                              className="form-select" 
                              value={selectedMonthlyYear} 
                              onChange={handleMonthlyYearChange}
                            >
                              {availableYears.map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <Line data={monthlyChartData} options={monthlyChartOptions} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (<NotAuthorized />)}
    </div>
  )
}

export default ManagerReports
