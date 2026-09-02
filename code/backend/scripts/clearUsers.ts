// One-off admin script - deletes ALL rows from the users table.
// Useful during early dev/testing when stale test accounts (created before
// roles or the OTP-gated signup flow existed) are cluttering the database
// and you want a clean slate so the next signup is genuinely the first user.
//
// Run from code/backend:
//   npm run db:clear-users
//
// Requires typing "yes" to confirm - this is NOT reversible.

import readline from "readline";
import { prisma } from "../src/config/prisma";

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const count = await prisma.user.count();

  if (count === 0) {
    console.log("No users found in the database - nothing to delete.");
    return;
  }

  console.log(`This will PERMANENTLY delete all ${count} user(s) from the database.`);
  console.log("This cannot be undone.");
  const answer = await ask('Type "yes" to confirm: ');

  if (answer.toLowerCase() !== "yes") {
    console.log("Cancelled - no changes made.");
    return;
  }

  const result = await prisma.user.deleteMany({});
  console.log(`Deleted ${result.count} user(s). The next signup will be the first user.`);
}

main()
  .catch((err) => {
    console.error("Failed to clear users:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
