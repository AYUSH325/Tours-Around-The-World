const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const { isUserLoggedIn, isUserAuthorized } = authController;
const {
  getCheckoutSession,
  createBooking,
  getBooking,
  getAllBookings,
  updateBooking,
  deleteBooking
} = bookingController;

const router = express.Router();

router.use(isUserLoggedIn);

router.get('/checkout-session/:tourId', getCheckoutSession);

router.use(isUserAuthorized(['admin', 'lead-guide']));
router
  .route('/')
  .get(getAllBookings)
  .post(createBooking);

router
  .route('/:id')
  .get(getBooking)
  .patch(updateBooking)
  .delete(deleteBooking);

module.exports = router;
