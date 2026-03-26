const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

/*  The commented out `multer.diskStorage` configuration is setting up a storage engine using the
`diskStorage` method provided by Multer. It specifies where to store the uploaded files on the disk
and how to name the files. The `destination` function determines the directory where the files will
be saved, and the `filename` function specifies the naming convention for the files. */

// const multerStorage = multer.diskStorage({
//   destination: (req, file, callbackFunction) => {
//     callbackFunction(null, 'public/img/users'); // ? first argument is the error. If no error is present, use null
//   },
//   filename: (req, file, callbackFunction) => {
//      * file stands for req.file
//      * file exists during the upload, req.file exists after the upload DONE BY MULTER
//     const ext = file.mimetype.split('/')[1];
//     callbackFunction(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

/* `const multerStorage = multer.memoryStorage();` is setting up a storage engine using the
`memoryStorage` method provided by Multer. This configuration specifies that the uploaded files will
be stored in memory instead of being written to disk. Storing files in memory can be useful for
processing the files in-memory before saving them to disk or for temporary storage where writing to
disk is not necessary. */
const multerStorage = multer.memoryStorage();

// * used to test for file types
const multerFilter = (req, file, callbackFunction) => {
  if (file.mimetype.startsWith('image')) {
    callbackFunction(null, true);
  } else {
    callbackFunction(
      new AppError(
        'Invalid file type. Only image files (JPG, PNG) are allowed.',
        404,
      ),
      false,
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// * 'photo' stands for the name in the FORM
// * single means only one upload
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // * If saved in memory, file.filename is NOT defined
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 100 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObject = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObject[el] = obj[el];
  });
  return newObject;
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  //Create an error if the user POSTs password data
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'To change your password, please use the dedicated password update feature.',
        400,
      ),
    );
  //Update the user
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

//Factory functions
//Same across all controllers
exports.getUser = factory.getOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.getAllUsers = factory.getAll(User);
exports.updateUser = factory.updateOne(User);
