const express = require('express');
const viewController = require('./../controllers/viewController');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');

const {
  getOverview,
  getTour,
  userLoginForm,
  getAccount,
  updateUserData,
  getMyTours
} = viewController;
const { isUserLoggedInFrontend, isUserLoggedIn } = authController;
const { createBookingCheckout } = bookingController;

const router = express.Router();

router.get('/me', isUserLoggedIn, getAccount);
router.post('/submit-user-data', isUserLoggedIn, updateUserData);
router.get('/my-tours', isUserLoggedIn, getMyTours);

router.get(
  '/',
  createBookingCheckout,
  isUserLoggedInFrontend,
  getOverview
);

router.use(isUserLoggedInFrontend);
router.get('/tour/:slug', getTour);
router.get('/login', userLoginForm);

module.exports = router;
