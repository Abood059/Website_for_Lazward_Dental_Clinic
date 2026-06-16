const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const globalErrorHandler = require('./middleware/globalErrorHandler');

// Require Routes (will be created later)
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const caseRoutes = require('./routes/case.routes');
const contentRoutes = require('./routes/content.routes');
const leadRoutes = require('./routes/lead.routes');
const statsRoutes = require('./routes/stats.routes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  credentials: true,
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(__dirname));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/stats', statsRoutes);

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
