const AppError = require('../utils/appError');
const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

const { createOne, getAll, getOne, deleteOne, updateOne } = factory;

exports.setTourUserId = (req, res, next) => {
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }
  req.body.user = req.user.id;
  next();
};

exports.checkIfAuthor = async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (req.user.role !== 'admin' && req.user.id !== review.user.id) {
    return next(
      new AppError(
        "You cannot edit/delete someone else's review",
        403
      )
    );
  }
  next();
};

exports.getAllReviews = getAll(Review);
exports.createNewReview = createOne(Review);
exports.getReview = getOne(Review);
exports.updateReview = updateOne(Review);
exports.deleteReview = deleteOne(Review);
