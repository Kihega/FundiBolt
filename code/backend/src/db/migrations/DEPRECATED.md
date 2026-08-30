# Deprecated

The `001_create_users_table.sql` file in this folder is no longer used.

As of Patch 005, database schema and migrations are managed by **Prisma**
(`code/backend/prisma/schema.prisma`). Run:

    npx prisma migrate dev --name init

to create and apply migrations going forward. Prisma stores its own
migration history in `code/backend/prisma/migrations/`.
