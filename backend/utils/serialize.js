// The frontend (originally built against MongoDB/Mongoose) expects every
// record's primary key as "_id" and expects populated relations to appear
// as an object under the *Id key itself (e.g. fee.academicYearId = { _id, name }).
// These helpers reshape Prisma's plain "id" rows into that same shape so the
// React app didn't need to change when the database moved to PostgreSQL.

const withUnderscoreId = (row) => {
  if (!row) return row;
  const { id, ...rest } = row;
  return { _id: id, ...rest };
};

const serializeUser = (user) => {
  if (!user) return user;
  const { password, ...rest } = user;
  return withUnderscoreId(rest);
};

const serializeAcademicYear = (year) => withUnderscoreId(year);

const serializeParent = (parent) => withUnderscoreId(parent);

// fee: optionally attach populated parent/academicYear objects under the
// *Id keys, mirroring Mongoose's .populate() output shape.
const serializeFee = (fee) => {
  if (!fee) return fee;
  const { parent, academicYear, payments, ...rest } = fee;
  const out = withUnderscoreId(rest);
  if (parent) out.parentId = serializeParent(parent);
  if (academicYear) out.academicYearId = serializeAcademicYear(academicYear);
  return out;
};

const serializePayment = (payment) => {
  if (!payment) return payment;
  const { parent, academicYear, fee, createdBy, ...rest } = payment;
  const out = withUnderscoreId(rest);
  if (parent) out.parentId = serializeParent(parent);
  if (academicYear) out.academicYearId = serializeAcademicYear(academicYear);
  if (fee) out.feeId = serializeFee(fee);
  if (createdBy) out.createdBy = serializeUser(createdBy);
  return out;
};

module.exports = {
  withUnderscoreId,
  serializeUser,
  serializeAcademicYear,
  serializeParent,
  serializeFee,
  serializePayment,
};
