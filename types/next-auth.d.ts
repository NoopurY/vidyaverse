import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "AICTE_ADMIN" | "INSTITUTION" | "STUDENT";
      permission: string;
      region?: string;
      institutionId?: string;
      studentApaar?: string;
      isDegreeAwarding?: boolean;
      institutionName?: string;
    };
  }
}
