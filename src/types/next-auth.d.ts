import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      profileCompleted?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    profileCompleted?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    profileCompleted?: boolean;
  }
}
