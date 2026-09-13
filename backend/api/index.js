// Vercel serverless entry point.
// Every request under /api/* (see vercel.json rewrites) is routed here.
// Prisma's client (lib/prisma.js) is cached across warm invocations, so
// there's no manual connect/disconnect needed per request.
require("dotenv").config();
const app = require("../app");

module.exports = (req, res) => app(req, res);
