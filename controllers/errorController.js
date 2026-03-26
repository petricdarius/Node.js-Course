const AppError = require('../utils/appError');

const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path}: ${error.value}.`;
  return new AppError(message, 400);
};

const handleDublicateFieldsDB = (error) => {
  const value = error.errorResponse.errmsg.match(/(\"[\w\s]+\")/)[0];
  const message = `Dublicate field value: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (error) => {
  const errors = Object.values(error.errors).map((el) => el.message);
  // console.log(errors);
  const message = `Invalid input data. ${errors.join(' ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (error, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      error,
      stack: error.stack,
    });
  }
  //Rendered website
  // console.log('Error!', error);
  return res.status(error.statusCode).render('error', {
    title: 'Something went wrong.',
    msg: error.message,
  });
};

const sendErrorProd = (error, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    //Trusted error, anticipated by the programmer
    if (error.isOperational) {
      return res
        .status(error.statusCode)
        .json({ status: error.status, message: error.message });
    }

    //Untrusted error, packages error, etc
    // console.log('Error!', error);
    return res.status(500).json({
      status: 'Error',
      message: 'Oops! Something went wrong.',
    });
  }

  //Rendered website
  if (error.isOperational) {
    return res.status(error.statusCode).render('error', {
      title: 'Something went wrong.',
      msg: error.message,
    });
  }
  //Programming / untrusted error, packages error, etc
  // console.log('Error!', error);
  return res.status(error.statusCode).render('error', {
    title: 'Something went wrong.',
    msg: 'Unexpected error. Please try again later.',
  });
};

const handleJWTError = () =>
  new AppError('Authentication failed: invalid JWT token', 401);

const handleJWTExpiredError = () =>
  new AppError('Your session has expired. Please log in again.', 401);

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    //Not enumerable, DO NOT JUST DO ={...error} - won't work!!!
    let err = {
      ...error,
      name: error.name,
      message: error.message,
    };
    if (err.name === 'CastError') err = handleCastErrorDB(err);
    if (err.code === 11000) err = handleDublicateFieldsDB(err);
    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') err = handleJWTError();
    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();
    sendErrorProd(err, req, res);
  }
};
