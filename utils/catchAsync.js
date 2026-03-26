module.exports = catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); //error => next(error) is the same as just calling next
  };
};
