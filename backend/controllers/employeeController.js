const prisma = require("../lib/prisma");
const { serializeEmployee } = require("../utils/serialize");

const TYPES = ["teacher", "staff"];
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const STATUSES = ["active", "inactive"];

// Next display code (E001, E002...) from the highest in use, not a count —
// a count reissues a code that still belongs to another row after a delete.
const nextEmployeeId = async () => {
  const last = await prisma.employee.findFirst({
    orderBy: { employeeId: "desc" },
    select: { employeeId: true },
  });
  const lastNum = last ? parseInt(last.employeeId.replace(/\D/g, ""), 10) || 0 : 0;
  return `E${String(lastNum + 1).padStart(3, "0")}`;
};

const badRequest = (message) => Object.assign(new Error(message), { statusCode: 400 });

// Validates and normalizes the writable fields; only keys present in `body`
// are returned so PUT can update a subset.
const parseFields = (body, { partial }) => {
  const out = {};
  const has = (k) => body[k] !== undefined;

  if (has("fullName") || !partial) {
    if (!body.fullName || !String(body.fullName).trim()) throw badRequest("Magaca waa waajib.");
    out.fullName = String(body.fullName).trim();
  }
  if (has("type") || !partial) {
    const type = body.type || "teacher";
    if (!TYPES.includes(type)) throw badRequest("Nooca waa inuu noqdaa macalin ama shaqaale.");
    out.type = type;
  }
  if (has("monthlySalary") || !partial) {
    const salary = Number(body.monthlySalary);
    if (!Number.isFinite(salary) || salary < 0) throw badRequest("Mushaharka bishii waa inuu noqdaa tiro 0 ama ka weyn.");
    out.monthlySalary = salary;
  }
  if (has("status")) {
    if (!STATUSES.includes(body.status)) throw badRequest("Xaaladda khalad ah.");
    out.status = body.status;
  }
  ["startMonth", "endMonth"].forEach((k) => {
    if (has(k)) {
      const v = body[k] ? String(body[k]).trim() : "";
      if (v && !MONTH_RE.test(v)) throw badRequest("Bisha waa inay noqotaa qaabka YYYY-MM.");
      out[k] = v || null;
    }
  });
  ["phone", "position", "notes"].forEach((k) => {
    if (has(k)) out[k] = body[k] ? String(body[k]).trim() || null : null;
  });
  if (out.startMonth && out.endMonth && out.startMonth > out.endMonth) {
    throw badRequest("Bisha uu bilaabay waa inaysan ka dambeyn bisha ugu dambeysay.");
  }
  return out;
};

// GET /api/employees?search=&type=&status=
const getEmployees = async (req, res, next) => {
  try {
    const { search, type, status } = req.query;
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { position: { contains: search, mode: "insensitive" } },
      ];
    }
    const employees = await prisma.employee.findMany({ where, orderBy: { employeeId: "asc" } });
    res.json(employees.map(serializeEmployee));
  } catch (err) {
    next(err);
  }
};

// POST /api/employees
const createEmployee = async (req, res, next) => {
  try {
    const data = parseFields(req.body, { partial: false });
    const employee = await prisma.employee.create({ data: { ...data, employeeId: await nextEmployeeId() } });
    res.status(201).json(serializeEmployee(employee));
  } catch (err) {
    next(err);
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res, next) => {
  try {
    const data = parseFields(req.body, { partial: true });
    const employee = await prisma.employee.update({ where: { id: req.params.id }, data });
    res.json(serializeEmployee(employee));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/employees/:id
// An employee with salary history can't be deleted — that would erase the
// payment records too. Mark them "inactive" instead.
const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!employee) return res.status(404).json({ message: "Shaqaalaha lama helin." });

    const payments = await prisma.salaryPayment.count({ where: { employeeId: employee.id } });
    if (payments > 0) {
      return res.status(400).json({
        message: `${employee.fullName} wuxuu leeyahay ${payments} mushahar oo la bixiyey, sidaa darteed lama tirtiri karo. Ka dhig "Inactive" halkii.`,
      });
    }
    await prisma.employee.delete({ where: { id: employee.id } });
    res.json({ message: "La tirtiray." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getEmployees, createEmployee, updateEmployee, deleteEmployee };
