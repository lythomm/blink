"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";

export const sendOtpEmail = action({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY is not configured. Email sending is skipped.");
      console.log(`[MOCK EMAIL] OTP for ${args.email}: ${args.code}`);
      return;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Blink <onboarding@resend.dev>",
        to: args.email,
        subject: `${args.code} est votre code de connexion Blink`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0D0D0D; color: #FFFFFF; border-radius: 12px;">
            <h2 style="font-family: serif; font-size: 32px; margin-bottom: 20px; color: #FFFFFF;">Blink.</h2>
            <p style="font-size: 16px; color: #B3B3B3; line-height: 1.5;">Voici votre code de vérification pour créer votre événement sur Blink :</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 6px; text-align: center; margin: 30px 0; padding: 15px; background-color: #111111; border: 1px solid #374151; border-radius: 8px; color: #FFFFFF;">
              ${args.code}
            </div>
            <p style="font-size: 12px; color: #6B7280;">Ce code est valable pendant 10 minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to send OTP email: ${errorText}`);
      console.log(`[FALLBACK LOG] OTP for ${args.email}: ${args.code}`);
      // Désactivé pour le MVP : ne pas jeter d'erreur
      // throw new Error("Failed to send OTP email: Provider error");
    }
  },
});

export const sendWelcomeKitEmail = action({
  args: {
    email: v.string(),
    userName: v.string(),
    eventName: v.string(),
    eventSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY is not configured. Email sending is skipped.");
      console.log(`[MOCK EMAIL] Welcome Kit for ${args.email} / Event: ${args.eventName}`);
      return;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Blink <onboarding@resend.dev>",
        to: args.email,
        subject: `Votre événement "${args.eventName}" est prêt sur Blink !`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0D0D0D; color: #FFFFFF; border-radius: 12px;">
            <h2 style="font-family: serif; font-size: 32px; margin-bottom: 20px; color: #FFFFFF;">Blink.</h2>
            <p style="font-size: 16px; color: #B3B3B3; line-height: 1.5;">Bonjour ${args.userName},</p>
            <p style="font-size: 16px; color: #B3B3B3; line-height: 1.5;">Félicitations, votre pellicule numérique pour <strong>${args.eventName}</strong> est prête !</p>
            <p style="font-size: 16px; color: #B3B3B3; line-height: 1.5;">Vous pouvez dès à présent la partager avec vos invités pour capturer de magnifiques moments.</p>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #111111; border: 1px solid #374151; border-radius: 8px; text-align: center;">
              <p style="font-size: 14px; color: #B3B3B3; margin-bottom: 10px;">Lien direct de l'événement :</p>
              <a href="https://blink-photo.fr/join/${args.eventSlug}" style="display: inline-block; padding: 12px 24px; background-color: #FFFFFF; color: #0D0D0D; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Rejoindre l'événement
              </a>
            </div>

            <p style="font-size: 14px; color: #B3B3B3; line-height: 1.5;">
              Code de l'événement à partager : <strong style="color: #FFFFFF; font-size: 18px;">${args.eventSlug.toUpperCase()}</strong>
            </p>
            <p style="font-size: 12px; color: #6B7280; margin-top: 30px; border-top: 1px solid #374151; padding-top: 20px;">
              Merci d'utiliser Blink, l'expérience photo skeuomorphique et argentique unique.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to send Welcome Kit email: ${errorText}`);
      console.log(`[FALLBACK LOG] Welcome Kit for ${args.email} / Event: ${args.eventName}`);
      // Désactivé pour le MVP : ne pas jeter d'erreur pour ne pas bloquer la création d'événement
      // throw new Error("Failed to send Welcome Kit email: Provider error");
    }
  },
});
