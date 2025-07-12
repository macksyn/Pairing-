require('dotenv').config();
const express = require('express');
const path = require('path');
const pairRoute = require('./routes/pair');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(pairRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✨ Lussh AI Pair Server running on port ${PORT}`));