const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = err => {
  const value = Object.values(err.keyValue)[0];
  const message = `${value} already exists. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const value = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${value.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please login again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again', 401);

const errorDev = (err, req, res) => {
  // 1) API
  if (req.originalUrl.startsWith('/api')) {
    // A)Operational, trusted error: send message to client
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  // 2) Rendered Website
  //B) Programming or other unknown error: No leak of details
  console.error('Error', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    message: err.message
  });
};

const errorProd = (err, req, res) => {
  //1)API
  if (req.originalUrl.startsWith('/api')) {
    // A)Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    //B) Programming or other unknown error: No leak of details
    console.error('Error', err);

    return res.status(500).json({
      status: 'error',
      message:
        'Something went wrong, We will fix it as soon as possible'
    });
  }
  //2) Rendered Website
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      message: err.message
    });
  }
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    message:
      'Something went wrong, We will fix it as soon as possible'
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode ? err.statusCode : 500;
  err.status = err.status ? err.status : 'error';

  if (process.env.NODE_ENV === 'development') {
    //Development
    errorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Production
    let error = Object.assign(err);

    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    } else if (error.code === 11000) {
      error = handleDuplicateFieldDB(error);
    } else if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    } else if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    } else if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }
    errorProd(error, req, res);
  }
};
