const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AppError = require('../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const Email = require('./../utils/email');

const loginToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = loginToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() +
        process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  });

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
    photo: req.body.photo
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1.) if email and password exists
  if (!email || !password) {
    return next(
      new AppError('Please provide email and password', 400)
    );
  }
  //2.) Check if user exists and password is correct

  const user = await User.findOne({ email }).select('+password');

  const verifiedPassword = user
    ? await user.matchPassword(password, user.password)
    : null;

  if (!user || !verifiedPassword) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //3.) Send JWT back to client
  createAndSendToken(user, 200, res);
});

exports.isUserLoggedIn = catchAsync(async (req, res, next) => {
  //1.) Getting token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('Please Login before accessing this route', 401)
    );
  }
  //2.) Veification: Validate Token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  //3.) Check if user exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to the token no longer exists',
        401
      )
    );
  }

  //4.) Check if user changed password afer the token was used
  if (currentUser.changedPasswordAfterLogin(decoded.iat)) {
    return next(
      new AppError(
        'You have recently changed password! Please login again.',
        401
      )
    );
  }
  // Grant Access to Protected Route
  req.user = currentUser;

  //Grant user access to pug templates
  res.locals.user = currentUser;

  next();
});

exports.isUserAuthorized = roles => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action',
          403
        )
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1.) Get user based on Posted email
  const user = await User.findOne({
    email: req.body.email
  });

  if (!user) {
    return next(
      new AppError(
        'Email address not found! Please enter correct email address',
        404
      )
    );
  }
  //2.) Generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3.) Send it to user's email

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}//api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiresIn = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1.) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpiresIn: { $gt: Date.now() }
  });

  //2.) if token has not expired, set new password

  if (!user) {
    return next(new AppError('Token is invalid or expired'), 400);
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiresIn = undefined;
  await user.save();

  //3.) Update changePasswordAt property for the user
  //4.) Log the user in, send JWT
  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');
  const isCorrectPassword = await user.matchPassword(
    req.body.currentPassword,
    user.password
  );
  if (!isCorrectPassword) {
    return next(
      new AppError('Password entered is incorrect, try again!', 401)
    );
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createAndSendToken(user, 200, res);
});

// Only for rendered pages, no errors!
exports.isUserLoggedInFrontend = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //1) Verify Token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //2.) Check if user exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      //3.) Check if user changed password afer the token was used
      if (currentUser.changedPasswordAfterLogin(decoded.iat)) {
        return next();
      }

      // There is a logged in User
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
