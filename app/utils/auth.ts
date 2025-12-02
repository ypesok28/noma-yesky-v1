import { betterAuth } from 'better-auth';
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from '@/src/db/client';
import { sendEmail } from './email';
import { hashCode } from './utils';


export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
        apple: {
            clientId: process.env.APPLE_CLIENT_ID!,
            clientSecret: process.env.APPLE_CLIENT_SECRET!,
        },
    },
    emailVerification: {
        sendVerificationEmail: async ( { user, url, token }, request) => {
            const numericCode = (Math.abs(hashCode(token)) % 1_000_000)
            .toString()
            .padStart(6, "0");

            // TODO: store `numericCode` somewhere server-side associated with that user / token
            // (DB table: userId, code, expiresAt, used: boolean)

            await sendEmail({
            to: user.email,
            subject: "Your verification code",
            text: `Your verification code is: ${numericCode}\n\nIt will expire in 10 minutes.`,
            });
        },
    }   
});