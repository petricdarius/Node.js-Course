//pre-installed
const path = require('path');
const express = require('express');

//installed from npm
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const compression = require('compression');
const cors = require('cors');

//utils imports
const AppError = require('./utils/appError');

//controllers imports
const globalErrorHandler = require('./controllers/errorController');

//routes imports
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const bookingController = require('./controllers/bookingController');

const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Development logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

//Limit request from the same IP
const limiter = rateLimit({
  //100 requests, from the same ip, in ONE hour
  max: 100,
  windowMs: 60 * 60 * 1000,
  //Error message
  message: 'Too many requests from this IP! Please try again in one hour.',
});
app.use('/api', limiter);

//* Checkout
//! Always needs to be text, so use before express.json()
app.post(
  '/webhook-checkout',
  express.raw({ type: 'applications/json' }),
  bookingController.webhookCheckout,
);

//Body parser, reading data from the body into req.body
app.use(
  express.json({
    limit: '10kb',
  }),
);
app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb',
  }),
);

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS attacks
app.use(xss());

//Prevent parameter polution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuality',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

app.use(compression());

//Implementing CORS
//* If added in the routes, it only allows it for a specific route
app.use(cors());
/* 
*This is how to use for a specific URL(In case of, let's samy, frontend on another server from the backend)
app.use(cors({
  origin: 'http//natours.com'
}))
*/

app.options('*', cors());

//Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//Template routes
app.use('/', viewRouter);

//Backend routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

/* Catch-all route middleware in Express. This middleware is used to handle any requests that
do not match any of the defined routes in the application. */
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
