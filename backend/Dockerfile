FROM node:18-alpine

# Alpine ships no OpenSSL headers by default; Prisma's query engine needs it.
RUN apk add --no-cache openssl

WORKDIR /app

# Install deps first so this layer is cached unless package.json changes.
# prisma/schema.prisma is copied too: "npm ci" runs postinstall (prisma
# generate), which needs the schema present before it runs.
COPY package*.json ./
COPY prisma ./prisma
# Retry: prisma's postinstall step downloads engine binaries over the
# network, which occasionally drops the connection mid-download.
RUN for i in 1 2 3 4 5; do npm ci && break || sleep 5; done

COPY . .

EXPOSE 5000

# Apply any pending migrations, then start the API. Safe to run on every
# container start: a database already up to date is a no-op.
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
