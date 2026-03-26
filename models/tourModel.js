const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');

const toursSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour name must be provided.'],
      unique: true,
      trim: true,
      maxlength: [40, 'Tour name cannot be longer than 40 characters long.'],
      minlength: [10, 'Tour name must be at least 10 characters long.'],
      // validate: [
      //   validator.isAlpha,
      //   'A tour name must only contain characters.',
      // ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration.'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size.'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a group difficulty.'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Please choose between easy, medium or difficult.',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 3.0,
      min: [1, 'Rating must be above 1.0 .'],
      max: [5, 'Rating must be below 5.0 .'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'A tour price must be provided.'] },
    priceDiscount: {
      type: Number,
      validate: {
        //DOESNT WORK for updating, "this" has access to only the document that WAS JUST CREATED
        validator: function (val) {
          //always return true or false
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below the original price.',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary.'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have an image cover.'],
    },
    images: [String],
    createdAt: {
      select: false,
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: { type: Boolean, default: false },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

toursSchema.index({
  price: 1 /*1 for ascending order, -1 for descending order */,
  ratingsAverage: -1,
});
toursSchema.index({ slug: 1 });
toursSchema.index({ startLocation: '2dsphere' });

//.get() is called everytime we get something from the db
toursSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//Virtual populate, used to connect the fields
toursSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//Document middleware: runs before the .save() command and the .create() command, not for .insertMany() !!!!
toursSchema.pre('save', function () {
  this.slug = slugify(this.name, { lower: true });
});

//Embedding guides into tour documents
// toursSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(
//     async (guide_id) => await User.findById(guide_id),
//   );
//   this.guides = await Promise.all(guidesPromises);
// });
// toursSchema.pre('save', function () {
//   console.log('Will save document.');
// });

// toursSchema.post('save', function (doc) {
//   console.log(doc);
// });

//Query middleware
//Works, but only for getting ALL the tours
// toursSchema.pre('find', function () {
//   console.log(this)
//   this.find({ secretTour: { $ne: true } });
// });

//Works for EVERY query that contains find
//pre = before, post = after
toursSchema.pre(/^find/, function () {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
});

// toursSchema.post(/^find/, function (docs) {
//   console.log(`Query took: ${Date.now() - this.start} miliseconds`);
// });

toursSchema.pre(/^find/, function () {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  }).populate({
    path: 'reviews',
  });
});
//Aggregation middleware
// toursSchema.pre('aggregate', function () {
//   // this._pipeline[0]['$match'].secretTour = { $ne: true }; NEVER do this
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
// });

const Tour = mongoose.model('Tour', toursSchema);

module.exports = Tour;
