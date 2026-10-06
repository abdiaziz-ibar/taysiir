require("dotenv").config();
const app = require("./app");
const prisma = require("./lib/prisma");
const materializeRecurring = require("./utils/materializeRecurring");

const PORT = process.env.PORT || 5000;

// Verify the database connection once at boot, then start listening.
// Prisma manages its own connection pool internally after that.
prisma
  .$connect()
  .then(() => {
    console.log("PostgreSQL ku xiran (connected) ✅");
    // Old monthly expenses become normal ones; a failure here must not stop the server.
    return materializeRecurring()
      .catch((err) => console.error("Kharashyada bil kasta lama beddeli karin:", err.message))
      .then(() => app.listen(PORT, () => console.log(`Server wuxuu ka shaqeynayaa port ${PORT}`)));
  })
  .catch((err) => {
    console.error("Database-ka lama xirmi karo:", err.message);
    process.exit(1);
  });
