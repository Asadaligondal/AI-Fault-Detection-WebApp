const express = require('express');
const path = require('path');
const authRoutes = require('./routes/auth');
const mongoose = require('mongoose');
const dashboardRoutes = require('./routes/protected');
const authMiddleware = require('./middleware/authMiddleware');

// here we connect with the mongoDB database
mongoose.connect('mongodb://127.0.0.1:27017/auth', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {console.log('MongoDB connected')}).catch((err) => {console.log(err)});

const app = express();
// setting up a medallware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

//mount the router on the api path to handle the requests
app.use('/api/auth', authRoutes);
app.get('/', authMiddleware,(req, res)=>{
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

app.use('/api/protected', dashboardRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});