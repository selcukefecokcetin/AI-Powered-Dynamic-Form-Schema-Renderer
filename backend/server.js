import 'dotenv/config';

import app from './src/app.js';

// --------------------------------------------------
// SERVER
// --------------------------------------------------

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});