const express = require('express');
const cors = require('cors');
require('dotenv').config();

const appRoutes = require('./routes/app.routes');

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';
app.use(cors({ origin: corsOrigin.split(',').map((o) => o.trim()) }));
app.use(express.json({ limit: '20mb' })); // limit raised a bit in case a PDF attachment is sent as base64

app.use('/api', appRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`HRMS mail backend running on http://localhost:${PORT}`);
});
