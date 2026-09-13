require("dotenv").config();
const app = require("./app");
const prisma = require("./lib/prisma");

const PORT = process.env.PORT || 5000;

// Verify the database connection once at boot, then start listening.
// Prisma manages its own connection pool internally after that.
prisma
  .$connect()
  .then(() => {
    console.log("PostgreSQL ku xiran (connected) ✅");
    app.listen(PORT, () => console.log(`Server wuxuu ka shaqeynayaa port ${PORT}`));
  })
  .catch((err) => {
    console.error("Database-ka lama xirmi karo:", err.message);
    process.exit(1);
  });
