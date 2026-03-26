import { UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      clinicId: string;
      clinicName: string;
    };
  }

  interface User {
    role: UserRole;
    clinicId: string;
    clinicName: string;
  }
}
