import connectToMongo from './db.js';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import noticeRoutes from './routes/notice.js'
import taskRoutes from './routes/task.js';
import projectRoutes from './routes/project.js';
import documentRoutes from './routes/documents.js';

connectToMongo();

const app = express();
const port = 5000;

app.use(cors()); 
app.use(express.json());
app.use('/notices', express.static('notices')); //serve files from the notices folder.
app.use('/task-attachments', express.static('task-attachments'));
app.use('/uploads', express.static('uploads')); //serve files from the uploads folder
app.use('/documents-attachments', express.static('documents-attachments')); //serve files from the documents-attachments folder

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/auth', authRoutes);
app.use('/api/notice', noticeRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
