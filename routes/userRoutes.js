const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const {
  getAllUsers,
  getEachUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  createUser,
  uploadUserPhoto,
  resizeUserPhoto
} = userController;

const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  isUserLoggedIn,
  updatePassword,
  isUserAuthorized,
  logout
} = authController;

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

//Protect all routes after this middleware
router.use(isUserLoggedIn);

router.patch('/updateMyPassword', updatePassword);
router.get('/me', getMe, getEachUser);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/deleteMe', deleteMe);

//Authorize all routes only to admin after this middleware
router.use(isUserAuthorized(['admin']));
router
  .route('/')
  .get(getAllUsers)
  .post(createUser);

router
  .route('/:id')
  .get(getEachUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
