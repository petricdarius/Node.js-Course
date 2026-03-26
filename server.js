const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (error) => {
  console.log(error.name, error.message);
  console.log('Uncaught expection! Shutting down...');
  setTimeout(() => process.exit(1), 3000);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DB_PASSWORD);

mongoose.connect(DB).then((con) => {
  console.log('Db connection established');
});

const PORT = process.env.PORT || 3000;

//Same, if host not specified, localhost is used as default
const server = app.listen(PORT, () => {
  console.log(`App running on port ${PORT}...`);
});

process.on('unhandledRejection', (error) => {
  console.log(error.name, error.message);
  console.log('Unhandled rejection! Shutting down...');
  server.close(() => {
    setTimeout(() => process.exit(1), 3000);
  });
});

process.on(`SIGTERM`, () => {
  console.log('👋SIGTERM Received. Shuttig down gracefully.');
  server.close(() => {
    console.log('✅ Process sucesfully terminated.');
  });
});

