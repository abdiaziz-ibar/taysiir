require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

const run = async () => {
  const existingAdmin = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash("Admin@123", 10);
    await prisma.user.create({
      data: {
        fullName: "System Administrator",
        username: "admin",
        email: "admin@school.local",
        password: hashed,
        role: "admin",
        status: "active",
      },
    });
    console.log("Admin user waa la abuuray -> username: admin | password: Admin@123");
  } else {
    console.log("Admin user horey buu u jiray.");
  }

  const now = new Date();
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const name = `${startYear}-${startYear + 1}`;
  const existingYear = await prisma.academicYear.findUnique({ where: { name } });
  if (!existingYear) {
    await prisma.academicYear.create({
      data: {
        name,
        startYear,
        endYear: startYear + 1,
        startMonth: "September",
        endMonth: "August",
        isActive: true,
      },
    });
    console.log(`Sanad Dugsiyeedka ${name} waa la abuuray oo waa firfircoon (active).`);
  } else {
    console.log(`Sanad Dugsiyeedka ${name} horey buu u jiray.`);
  }
};

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
