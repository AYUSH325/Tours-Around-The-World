const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const {
  getAllTours,
  createTour,
  getEachTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages
} = tourController;

const { isUserLoggedIn, isUserAuthorized } = authController;

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

router.route('/top-5-tours').get(aliasTopTours, getAllTours);

router.get('/tour-statistics', getTourStats);
router.get(
  '/monthly-plan/:year',
  isUserLoggedIn,
  isUserAuthorized(['admin', 'lead-guide', 'guide']),
  getMonthlyPlan
);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distance/:latlng/unit/:unit').get(getDistances);

router
  .route('/')
  .get(getAllTours)
  .post(
    isUserLoggedIn,
    isUserAuthorized(['admin', 'lead-guide']),
    createTour
  );

router
  .route('/:id')
  .get(getEachTour)
  .patch(
    isUserLoggedIn,
    isUserAuthorized(['admin', 'lead-guide']),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(
    isUserLoggedIn,
    isUserAuthorized(['admin', 'lead-guide']),
    deleteTour
  );

module.exports = router;
