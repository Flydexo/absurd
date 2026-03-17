import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, users, accounts, sessions, verificationTokens, invites } from "@absurd/db";
import { eq, count } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, profile }) {
      // Allow the very first user (admin bootstrapping)
      const [{ value: userCount }] = await db
        .select({ value: count() })
        .from(users);

      if (userCount === 0) return true;

      // Allow if GitHub username matches ADMIN_GITHUB_USERNAME env var
      const adminUsername = process.env.ADMIN_GITHUB_USERNAME;
      if (
        adminUsername &&
        (profile as { login?: string })?.login === adminUsername
      ) {
        return true;
      }

      // Allow if email is in invites table
      if (!user.email) return false;

      const invite = await db.query.invites.findFirst({
        where: eq(invites.email, user.email),
      });

      if (!invite) return false;

      // Mark invite as accepted
      if (!invite.acceptedAt) {
        await db
          .update(invites)
          .set({ acceptedAt: new Date() })
          .where(eq(invites.email, user.email));
      }

      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
