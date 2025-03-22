const express = require('express');
const router = express.Router();

//test controller
const test = (req, res) => {
  res.send({ message: 'Hello World' });
};

module.exports = { test };

// test route
router.get('/the/test', test);
module.exports = router;
