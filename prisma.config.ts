// Local development config — build sırasında kullanılmaz
// prisma generate --schema=./prisma/schema.prisma ile bypass edilir
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
