const prisma = require("../lib/prisma");
const { serializeAcademicYear } = require("../utils/serialize");

// GET /api/academic-years
const getAcademicYears = async (req, res, next) => {
  try {
    const years = await prisma.academicYear.findMany({ orderBy: { startYear: "desc" } });
    res.json(years.map(serializeAcademicYear));
  } catch (err) {
    next(err);
  }
};

// POST /api/academic-years
const createAcademicYear = async (req, res, next) => {
  try {
    const { startYear } = req.body;
    if (!startYear) return res.status(400).json({ message: "startYear waa waajib." });
    const endYear = Number(startYear) + 1;
    const name = `${startYear}-${endYear}`;

    const year = await prisma.academicYear.create({
      data: {
        name,
        startYear: Number(startYear),
        endYear,
        startMonth: "September",
        endMonth: "August",
      },
    });
    res.status(201).json(serializeAcademicYear(year));
  } catch (err) {
    next(err);
  }
};

// PUT /api/academic-years/:id
const updateAcademicYear = async (req, res, next) => {
  try {
    const { name, startYear, endYear, startMonth, endMonth, isActive } = req.body;
    const year = await prisma.academicYear.update({
      where: { id: req.params.id },
      data: { name, startYear, endYear, startMonth, endMonth, isActive },
    });
    res.json(serializeAcademicYear(year));
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Sanad Dugsiyeedka lama helin." });
    next(err);
  }
};

// PUT /api/academic-years/:id/activate
const activateAcademicYear = async (req, res, next) => {
  try {
    await prisma.$transaction([
      prisma.academicYear.updateMany({ data: { isActive: false } }),
      prisma.academicYear.update({ where: { id: req.params.id }, data: { isActive: true } }),
    ]);
    const year = await prisma.academicYear.findUnique({ where: { id: req.params.id } });
    res.json(serializeAcademicYear(year));
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Sanad Dugsiyeedka lama helin." });
    next(err);
  }
};

// PUT /api/academic-years/:id/deactivate
const deactivateAcademicYear = async (req, res, next) => {
  try {
    const year = await prisma.academicYear.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json(serializeAcademicYear(year));
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Sanad Dugsiyeedka lama helin." });
    next(err);
  }
};

// DELETE /api/academic-years/:id
const deleteAcademicYear = async (req, res, next) => {
  try {
    await prisma.academicYear.delete({ where: { id: req.params.id } });
    res.json({ message: "Sanad Dugsiyeedka waa la tirtiray." });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Sanad Dugsiyeedka lama helin." });
    next(err);
  }
};

module.exports = {
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  activateAcademicYear,
  deactivateAcademicYear,
  deleteAcademicYear,
};
