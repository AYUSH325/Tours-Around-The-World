const express = require('express');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');

const {
  getAllReviews,
  getReview,
  createNewReview,
  setTourUserId,
  deleteReview,
  updateReview,
  checkIfAuthor
} = reviewController;
const { isUserLoggedIn, isUserAuthorized } = authController;

const router = express.Router({ mergeParams: true });

router.use(isUserLoggedIn);
router
  .route('/')
  .get(getAllReviews)
  .post(isUserAuthorized(['user']), setTourUserId, createNewReview);

router
  .route('/:id')
  .get(getReview)
  .delete(
    isUserAuthorized(['user', 'admin']),
    checkIfAuthor,
    deleteReview
  )
  .patch(
    isUserAuthorized(['user', 'admin']),
    checkIfAuthor,
    updateReview
  );

module.exports = router;
