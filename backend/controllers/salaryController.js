const prisma = require("../lib/prisma");
const nextVoucherNumber = require("../utils/voucherNumber");
const { serializeEmployee, serializeSalaryPayment } = require("../utils/serialize");

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const METHODS = ["Cash", "Mobile Money", "Bank", "Other"];

const badRequest = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const sum = (list, key) => list.reduce((s, x) => s + x[key], 0);

// Salary owed for a period: whatever it was when the first payment for that
// month was recorded (so a later raise doesn't rewrite a settled month);
// before any payment exists it's the employee's current monthly salary.
const salaryDueFor = (employee, periodPayments) =>
  periodPayments.length > 0 ? periodPayments[0].salaryDue : employee.monthlySalary;

const statusFor = (due, paid) => {
  if (paid <= 0) return "unpaid";
  return paid >= due ? "paid" : "partial";
};

// The payroll sheet rows for one month: every active employee (plus any inactive
// one who was still paid that month) with what's due, paid and left.
const salaryRowsFor = async (period) => {
  const payments = await prisma.salaryPayment.findMany({
    where: { period },
    orderBy: { createdAt: "asc" },
  });
  const paidIds = [...new Set(payments.map((p) => p.employeeId))];
  const employees = await prisma.employee.findMany({
    where: { OR: [{ status: "active" }, { id: { in: paidIds } }] },
    orderBy: { employeeId: "asc" },
  });

  return employees.map((employee) => {
    const own = payments.filter((p) => p.employeeId === employee.id);
    const monthlySalary = salaryDueFor(employee, own);
    const totalPaid = sum(own, "amount");
    return {
      employee: serializeEmployee(employee),
      monthlySalary,
      totalPaid,
      balance: Math.max(monthlySalary - totalPaid, 0),
      status: statusFor(monthlySalary, totalPaid),
      payments: own.map(serializeSalaryPayment),
    };
  });
};

// GET /api/salaries/summary?period=YYYY-MM
const getSalarySummary = async (req, res, next) => {
  try {
    const period = req.query.period || currentPeriod();
    if (!PERIOD_RE.test(period)) throw badRequest("Bisha waa inay noqotaa qaabka YYYY-MM.");

    const rows = await salaryRowsFor(period);

    res.json({
      period,
      rows,
      totals: {
        salary: sum(rows, "monthlySalary"),
        paid: sum(rows, "totalPaid"),
        balance: sum(rows, "balance"),
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/salaries
// { employeeId, period, amount, paymentDate, paymentMethod, notes, allowOverpayment }
const createSalaryPayment = async (req, res, next) => {
  try {
    const { employeeId, period, amount, paymentDate, paymentMethod, notes, allowOverpayment } = req.body;

    if (!employeeId || !period || !amount || !paymentMethod) {
      throw badRequest("Fadlan buuxi dhammaan xogta lagama maarmaanka ah.");
    }
    if (!PERIOD_RE.test(period)) throw badRequest("Bisha waa inay noqotaa qaabka YYYY-MM.");
    if (!METHODS.includes(paymentMethod)) throw badRequest("Habka lacag bixinta khalad ah.");
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) throw badRequest("Lacagta waa inay ka weyn tahay 0.");

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw badRequest("Shaqaalaha lama helin.", 404);

    // One salary payment per employee per month. To change what was paid, edit that payment.
    const existing = await prisma.salaryPayment.findFirst({ where: { employeeId, period }, orderBy: { createdAt: "asc" } });
    if (existing) {
      throw badRequest(
        `Mushaharka ${employee.fullName} ee bisha ${period} horey ayaa loo bixiyey (${existing.voucherNumber}, $${existing.amount}). Fadlan Edit ka samee kii hore, ama dooro bil kale.`
      );
    }
    const due = employee.monthlySalary;
    if (!allowOverpayment && value > due) {
      throw badRequest(`Lacagta la geliyay ($${value}) way ka badan tahay mushaharka ($${due}).`);
    }

    const payment = await prisma.salaryPayment.create({
      data: {
        voucherNumber: await nextVoucherNumber("salaryPayment", "SAL"),
        employeeId,
        period,
        amount: value,
        salaryDue: due,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod,
        notes: notes ? String(notes).trim() || null : null,
        createdById: req.financeUser?._id || null,
      },
      include: { employee: true },
    });

    res.status(201).json(serializeSalaryPayment(payment));
  } catch (err) {
    next(err);
  }
};

// PUT /api/salaries/:id  { amount, paymentDate, paymentMethod, notes, allowOverpayment }
// Employee and month can't change (delete and record again for that).
const updateSalaryPayment = async (req, res, next) => {
  try {
    const { amount, paymentDate, paymentMethod, notes, allowOverpayment } = req.body;

    const payment = await prisma.salaryPayment.findUnique({ where: { id: req.params.id } });
    if (!payment) throw badRequest("Mushaharkan lama helin.", 404);

    const data = {};
    if (amount !== undefined) {
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) throw badRequest("Lacagta waa inay ka weyn tahay 0.");
      if (!allowOverpayment && value > payment.salaryDue) {
        throw badRequest(`Lacagta la geliyay ($${value}) way ka badan tahay mushaharka ($${payment.salaryDue}).`);
      }
      data.amount = value;
    }
    if (paymentMethod !== undefined) {
      if (!METHODS.includes(paymentMethod)) throw badRequest("Habka lacag bixinta khalad ah.");
      data.paymentMethod = paymentMethod;
    }
    if (paymentDate) {
      const d = new Date(paymentDate);
      if (Number.isNaN(d.getTime())) throw badRequest("Taariikhda khalad ah.");
      data.paymentDate = d;
    }
    if (notes !== undefined) data.notes = notes ? String(notes).trim() || null : null;

    const updated = await prisma.salaryPayment.update({ where: { id: payment.id }, data, include: { employee: true } });
    res.json(serializeSalaryPayment(updated));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/salaries/:id
const deleteSalaryPayment = async (req, res, next) => {
  try {
    await prisma.salaryPayment.delete({ where: { id: req.params.id } });
    res.json({ message: "La tirtiray." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSalarySummary, createSalaryPayment, updateSalaryPayment, deleteSalaryPayment, salaryRowsFor };
