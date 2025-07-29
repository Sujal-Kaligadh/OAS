import React, { useEffect, useState } from 'react'
import { useContext } from 'react'
import authContext from '../context/auth/authContext'
import alertContext from '../context/alert/alertContext'
import NotAuthorized from './NotAuthorized'
import Loading from './Loading'
import AddBtn from './AddBtn'
import Alert from './Alert'
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function ManagerHome() {
    const { authToken, user, loggedIn, userType } = useContext(authContext)
    const { showAlert } = useContext(alertContext)
    const [loading, setLoading] = useState(true);
    const [totalAssignedTasks, setTotalAssignedTasks] = useState(null);
    const [completedTasks, setCompletedTasks] = useState(null);
    const [inProgressTasks, setInProgressTasks] = useState(null);
    const [pendingTasks, setPendingTasks] = useState(null);
    const [overdueTasks, setOverdueTasks] = useState(null);
    const [billingsData, setBillingsData] = useState({
        labels: [],
        datasets: [],
    });

    // State for combined loading status
    const [overallLoading, setOverallLoading] = useState(true);

    // State for year filter
    const [selectedYear, setSelectedYear] = useState(''); // Default to empty or the first year fetched
    const [availableYears, setAvailableYears] = useState([]);

    // State for total bill amount of filtered projects
    const [totalBillAmount, setTotalBillAmount] = useState(0);

    // State for project counts based on bill image
    const [completedProjectsCount, setCompletedProjectsCount] = useState(0);
    const [pendingProjectsCount, setPendingProjectsCount] = useState(0);

    useEffect(() => {
        // This effect runs when either task or project data fetching is complete
        if (!loading && !overallLoading) {
            // Both data types have been fetched
            setOverallLoading(false);
        }
    }, [loading, overallLoading]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setLoading(true); // Start task loading
                if (!authToken) {
                    setLoading(false)
                    showAlert('Please login to view assigned tasks', 'error')
                    return
                }

                const response = await fetch(`http://localhost:5000/api/task/assigned-tasks`, {
                    method: 'GET',
                    headers: {
                        'auth-token': authToken,
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Session expired. Please login again.')
                    }
                    throw new Error('Failed to fetch assigned tasks')
                }

                const data = await response.json()
                console.log('Fetched assigned tasks data:', data); // Debug log

                setTotalAssignedTasks(data.length);
                let total_assigned_overdue_tasks = 0;
                let total_assigned_pending_tasks = 0;
                let total_assigned_in_progress_tasks = 0;
                let total_assigned_completed_tasks = 0;
            
                data.forEach(task => {
                    if (task.status === "Pending") {
                        total_assigned_pending_tasks++;
                    }
                    else if (task.status === "In Progress") {
                        total_assigned_in_progress_tasks++;
                    }
                    else if (task.status === "Overdue") {
                        total_assigned_overdue_tasks++;
                    }
                    else if (task.status === "Completed") {
                        total_assigned_completed_tasks++;
                    }
                });

                setCompletedTasks(total_assigned_completed_tasks);
                setInProgressTasks(total_assigned_in_progress_tasks);
                setPendingTasks(total_assigned_pending_tasks);
                setOverdueTasks(total_assigned_overdue_tasks);

            } catch (error) {
                showAlert(error.message, 'danger')
            } finally {
                setLoading(false)
            }
        }

        if (loggedIn && authToken) {
            fetchTasks()
        }
    }, [authToken, loggedIn, showAlert])

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setOverallLoading(true); // Start project loading
                if (!authToken) {
                    setOverallLoading(false);
                    return;
                }

                const response = await fetch('http://localhost:5000/api/projects/getprojects', {
                    headers: {
                        'auth-token': authToken
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
                }

                const projectsData = await response.json();

                // Filter projects by selected year
                const filteredProjects = selectedYear === 'All Years'
                    ? projectsData
                    : projectsData.filter(project => {
                        if (project.billingDate) {
                            const date = new Date(project.billingDate);
                            return date.getFullYear().toString() === selectedYear;
                        }
                        return true; // Include projects without a billing date
                    });

                // Calculate completed and pending projects based on billImage for the filtered projects
                const completed = filteredProjects.filter(project => project.billImage && project.billImage.fileName).length;
                const pending = filteredProjects.filter(project => !project.billImage || !project.billImage.fileName).length;
                
                setCompletedProjectsCount(completed);
                setPendingProjectsCount(pending);

                // Calculate total bill amount for filtered projects
                const total = filteredProjects.reduce((sum, project) => {
                    return sum + (project.billAmount || 0);
                }, 0);
                setTotalBillAmount(total);

                // Extract unique years for the filter
                const years = projectsData.reduce((acc, project) => {
                    if (project.billingDate) {
                        const year = new Date(project.billingDate).getFullYear().toString();
                        if (!acc.includes(year)) {
                            acc.push(year);
                        }
                    }
                    return acc;
                }, []).sort();
                setAvailableYears(years);

                // Set default selected year to the latest year if available
                if (years.length > 0 && selectedYear === '') {
                    setSelectedYear(years[years.length - 1]);
                }

                // Process data for charting
                const monthlyBillings = filteredProjects.reduce((acc, project) => {
                    if (project.billingDate && project.billAmount !== undefined && project.billAmount !== null) {
                        const date = new Date(project.billingDate);
                        const year = date.getFullYear();
                        const month = date.getMonth(); // 0-indexed
                        const key = `${year}-${month.toString().padStart(2, '0')}`;
                        if (!acc[key]) {
                            acc[key] = 0;
                        }
                        acc[key] += project.billAmount;
                    }
                    return acc;
                }, {});

                // Generate labels and data points for all 12 months of the selected year
                const labels = [];
                const dataPoints = [];
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                // Use the selectedYear for generating labels
                const targetYear = selectedYear === '' && years.length > 0 ? years[years.length - 1] : selectedYear;

                if (targetYear !== '') {
                   for (let i = 0; i < 12; i++) {
                       const monthKey = `${targetYear}-${i.toString().padStart(2, '0')}`;
                       labels.push(`${monthNames[i]} ${targetYear}`);
                       dataPoints.push(monthlyBillings[monthKey] || 0);
                   }
                }

                setBillingsData({
                    labels: labels,
                    datasets: [
                        {
                            label: 'Total Billing Amount',
                            data: dataPoints,
                            fill: false,
                            borderColor: 'rgb(34, 88, 150)',
                            tension: 0.1,
                        },
                    ],
                });

            } catch (error) {
                showAlert(error.message || 'Error fetching project data', 'danger');
            } finally {
                setOverallLoading(false); // End project loading
            }
        };

        if (loggedIn && authToken) {
            fetchProjects();
        }
    }, [authToken, loggedIn, showAlert, selectedYear]);

    return (
        <div>
            {loggedIn ? (
                <div>
                    {userType === "Manager" && (
                    <div>
                        <div className="mb-4">
                            <h3 className="text-center mb-3">Assigned Tasks</h3>
                        <div className="row text-center">
                            <div className="col">
                                <div className="card bg-primary p-2">
                                    <div className="card-title text-white fw-bold fs-5">{totalAssignedTasks} <br />Total Tasks</div>
                                </div>
                            </div>
                            <div className="col">
                                <div className="card bg-success p-2">
                                    <div className="card-title text-white fw-bold fs-5">{completedTasks} <br />Completed Tasks</div>
                                </div>
                            </div>
                            <div className="col">
                                <div className="card bg-info p-2">
                                    <div className="card-title text-white fw-bold fs-5">{inProgressTasks} <br />In Progress  Tasks</div>
                                </div>
                            </div>
                            <div className="col">
                                <div className="card bg-warning p-2">
                                    <div className="card-title text-white fw-bold fs-5">{pendingTasks} <br />Pending Tasks</div>
                                </div>
                            </div>
                            <div className="col">
                                <div className="card bg-danger p-2">
                                    <div className="card-title text-white fw-bold fs-5">{overdueTasks} <br />Overdue Tasks</div>
                                </div>
                            </div>
                        </div>
                        </div>
                        <div className="second-block row ">
                             <div className="col-md-3">
                                  {/* Completed Projects Card */}
                                  <div className="homepage-project-block card text-center p-2 mb-3">
                                      <div className="card-title text-white fw-bold fs-5">Completed Projects : {completedProjectsCount}</div>
                                  </div>
                                  {/* Pending Projects Card */}
                                  <div className="homepage-project-block card text-center p-2">
                                      <div className="card-title text-white fw-bold fs-5">Pending Projects : {pendingProjectsCount}</div>
                                  </div>
                             </div>
                             <div className="col-md-9 monthly-project-block">
                                 <h3 className="mb-3 text-center">Monthly Project Billings</h3>
                                 <div className="row">
                                     <div className="col-md-3">
                                        <div className="form-group mb-3">
                                            <label htmlFor="yearFilter">Filter by Year:</label>
                                            <select
                                                className="form-control"
                                                id="yearFilter"
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(e.target.value)}
                                            >
                                                {availableYears.map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                 </div>
                                 {overallLoading ? (
                                     <Loading />
                                 ) : billingsData.labels.length > 0 ? (
                                     <div style={{ height: '400px' }}>
                                         <Line
                                             data={billingsData}
                                             options={{
                                                 maintainAspectRatio: false,
                                                 plugins: {
                                                     tooltip: {
                                                         mode: 'index',
                                                         intersect: false,
                                                     },
                                                     legend: {
                                                         display: true,
                                                     },
                                                     datalabels: {
                                                         display: false,
                                                     },
                                                     title: {
                                                         display: true,
                                                         text: 'Monthly Project Billings',
                                                     },
                                                 },
                                                 scales: {
                                                     y: {
                                                         beginAtZero: true,
                                                         title: {
                                                             display: true,
                                                             text: 'Amount (Rs.)',
                                                         },
                                                     },
                                                     x: {
                                                         title: {
                                                             display: true,
                                                             text: 'Month - Year',
                                                         },
                                                     },
                                                 },
                                             }}
                                         />
                                     </div>
                                 ) : (
                                     <p>No billing data available.</p>
                                 )}
                                 {billingsData.labels.length > 0 && (
                                     <div className="mt-3">
                                         <h6>Total Billing Amount: Rs. {totalBillAmount.toFixed(2)}</h6>
                                     </div>
                                 )}
                             </div>
                         </div>
                    </div>
                    )}
                </div>
            ) : (<NotAuthorized />)}
        </div>
    )
}

export default ManagerHome;

// Update the styles at the end of the file
const styles = `
@keyframes slideNoticesHorizontal {
    0% {
        transform: translateX(0);
    }
    100% {
        transform: translateX(-50%);
    }
}

.notice-block {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.notice-item {
    background-color: #fff;
    transition: all 0.3s ease;
    border-right: 1px solid #eee;
}

.notice-item:hover {
    background-color: #f8f9fa;
}

.notice-content {
    background-color: #fff;
    border-radius: 0 0 4px 4px;
}

.notice-slider {
    animation: slideNoticesHorizontal 30s linear infinite;
}

.notice-slider:hover {
    animation-play-state: paused;
}
`;

// Add style tag to the component
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
