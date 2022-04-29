const mongoose = require('mongoose');
const slugify = require('slugify');

//creating a schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour should have a name'],
      unique: true,
      trim: true,
      maxLength: [
        40,
        'A tour name must have less or equal than 40 characters'
      ],
      minLength: [
        10,
        'A tour name must have greater or equal than 10 characters'
      ]
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'Please Specify Duration of Tour']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Specify maximum group size']
    },
    difficulty: {
      type: String,
      required: [true, 'specify level of difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, meduium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.8,
      min: [1, 'Rating should be above 1'],
      max: [5, 'Rating should be below 5'],
      set: value => Math.round(value * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'It is necessary for a tour to have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(priceDiscount) {
          return priceDiscount < this.price;
        },
        message:
          'Disocunt price ({VALUE}) should be lesser than price of tour'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour should have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 }); //slug is most queried
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//Virtual Populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

//Document MiddleWare runs before .save() and .create() not insertMany() or update()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//Query MiddleWare
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

//Aggreation Middleware
tourSchema.pre('aggregate', function(next) {
  if (
    !(this.pipeline().length > 0 && '$geoNear' in this.pipeline()[0])
  ) {
    this.pipeline().unshift({
      $match: { secretTour: { $ne: true } }
    });
  }
  next();
});

//creating a model for schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
