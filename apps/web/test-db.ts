import { db } from './lib/db';
import { githubConnections } from './lib/db/schema';

async function test() {
  try {
    const allConns = await db.query.githubConnections.findMany();
    console.log("ALL CONNECTIONS IN DB:", allConns);
  } catch (err) {
    console.error("ERROR:", err);
  }
}
test();
