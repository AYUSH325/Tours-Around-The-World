const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');

const {
  getOverview,
  getTour,
  userLoginForm,
  getAccount,
  updateUserData,
  getMyTours
} = viewController;
const { isUserLoggedInFrontend, isUserLoggedIn } = authController;

const router = express.Router();

router.get('/me', isUserLoggedIn, getAccount);
router.post('/submit-user-data', isUserLoggedIn, updateUserData);
router.get('/my-tours', isUserLoggedIn, getMyTours);

router.use(isUserLoggedInFrontend);
router.get('/', getOverview);
router.get('/tour/:slug', getTour);
router.get('/login', userLoginForm);

module.exports = router;
