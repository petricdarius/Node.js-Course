const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

//Setting the tour and user ID (used in POST to create a review )
exports.setTourAndUserIDs = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

//Factory functions
//Same across all controllers
exports.getReview = factory.getOne(Review);
exports.getAllReviews = factory.getAll(Review);
exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
