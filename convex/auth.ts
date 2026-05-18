import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { convexAuth } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

const CustomEmail = Email({
  id: "email",
  // Generates a 6-digit numeric OTP code
  generateVerificationToken() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
  // @ts-expect-error - Convex Auth passes GenericActionCtx as second argument at runtime, but Auth.js type signature doesn't declare it
  sendVerificationRequest: async ({ identifier: email, token }: { identifier: string; token: string }, ctx: any) => {
    await ctx.runAction(api.actions.emails.sendOtpEmail, {
      email,
      code: token,
    });
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      // verify: CustomEmail, // Désactivé pour le MVP
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
    }),
    CustomEmail,
  ],
});

