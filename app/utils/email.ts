type SendEmailArgs = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail({ to, subject, text }: SendEmailArgs) {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const res = await resend.emails.send({
      from: process.env.EMAIL_FROM || "My App <no-reply@example.com>",
      to,
      subject,
      text,
    });

    console.log("Email sent:", res);
    return res;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
