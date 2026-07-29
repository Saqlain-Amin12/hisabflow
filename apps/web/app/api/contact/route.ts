import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json() as {
    name: string; email: string; subject: string; message: string;
  };

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: `"HisabFlow Contact" <${process.env.SMTP_USER}>`,
    to: process.env.CONTACT_TO,
    replyTo: email,
    subject: subject?.trim() ? `[HisabFlow] ${subject.trim()}` : `[HisabFlow] Message from ${name}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0e7ff">
        <div style="background:linear-gradient(135deg,#4a7af5,#3b6ce0);padding:28px 32px">
          <h2 style="color:#fff;margin:0;font-size:20px;font-weight:800">HisabFlow: New Message</h2>
        </div>
        <div style="padding:28px 32px">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#6b7280;width:80px">From</td><td style="padding:8px 0;font-weight:600;color:#1a1a2e">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#4a7af5">${email}</a></td></tr>
            ${subject?.trim() ? `<tr><td style="padding:8px 0;color:#6b7280">Subject</td><td style="padding:8px 0;color:#1a1a2e">${subject}</td></tr>` : ""}
          </table>
          <hr style="border:none;border-top:1px solid #e0e7ff;margin:20px 0">
          <p style="color:#374151;font-size:14px;line-height:1.7;white-space:pre-wrap;margin:0">${message}</p>
        </div>
        <div style="padding:16px 32px;background:#f5f7ff;font-size:11px;color:#9ca3af">
          Sent via HisabFlow Contact Form
        </div>
      </div>`,
  });

  return NextResponse.json({ ok: true });
}
