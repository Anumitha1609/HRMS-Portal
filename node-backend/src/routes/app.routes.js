const express = require('express');
const router = express.Router();
const appController = require('../controllers/app.controller');

router.post('/save', appController.saveData);
router.post('/send-mail', appController.sendMail);

module.exports = router;
