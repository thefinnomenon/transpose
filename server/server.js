require('dotenv').config();
import app from './app';

app.listen(process.env.SERVER_PORT, () =>
  console.log(`Server listening on port ${process.env.SERVER_PORT}!`),
);
