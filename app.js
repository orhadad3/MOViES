const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const { refreshUserSession, verifyAuthenticated } = require('./middleware/authMiddleware.js');

const app = express();
const PORT = 3000;

// Configurable variable to toggle between MongoDB and Json files
const { useMongoDB, mongoUrl } = require('./config');

if (useMongoDB) {
  mongoose.connect(mongoUrl)
  .then (() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error: ', err));
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Client/views'));

app.use(express.static(path.join(__dirname, 'Client/public')));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: 'userSession',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    }
  })
);

app.use(refreshUserSession);

app.use(verifyAuthenticated);

app.use((req, res, next) => {
  res.locals.isAuthenticated = Boolean(req.session.username);
  res.locals.username = req.session.username;
  res.locals.userType = req.session.userType;
  next();
});

const indexRouter = require('./routes/index');
const detailsRouter = require('./routes/details');
const favoritesRouter = require('./routes/favorites');
const userRouter = require('./routes/users');
const errorRouter = require('./routes/404');
const previewRouter = require('./routes/preview');
const reviewRoutes = require('./routes/review');
const linksRouter = require('./routes/links');
const topLinks = require('./routes/toplinks.js');
const adminRouter = require('./routes/admin');

app.use('/', userRouter);
app.use('/', indexRouter);
app.use('/details', detailsRouter);
app.use('/favorites', favoritesRouter);
app.use('/preview', previewRouter);
app.use('/reviews', reviewRoutes);
app.use('/links', linksRouter);
app.use('/top-links', topLinks);
app.use('/admin', adminRouter);

app.use('*', errorRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

