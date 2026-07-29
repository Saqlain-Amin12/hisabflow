import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.db.database import get_db
from app.models.contact import ContactMessage

logger = logging.getLogger("uvicorn.error")
router = APIRouter()


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field("", max_length=200)
    message: str = Field(..., min_length=1, max_length=2000)


def _send_email(req: ContactRequest) -> bool:
    if not settings.smtp_user or not settings.smtp_pass or settings.smtp_pass == "your_gmail_app_password_here":
        logger.warning("SMTP not configured — email skipped.")
        return False
    try:
        html = f"""
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;
                    background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0e7ff">
          <div style="background:linear-gradient(135deg,#4a7af5,#3b6ce0);padding:28px 32px">
            <h2 style="color:#fff;margin:0;font-size:20px;font-weight:800">HisabFlow — New Message</h2>
          </div>
          <div style="padding:28px 32px">
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:8px 0;color:#6b7280;width:80px">From</td>
                  <td style="padding:8px 0;font-weight:600;color:#1a1a2e">{req.name}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Email</td>
                  <td style="padding:8px 0"><a href="mailto:{req.email}" style="color:#4a7af5">{req.email}</a></td></tr>
              {'<tr><td style="padding:8px 0;color:#6b7280">Subject</td><td style="padding:8px 0;color:#1a1a2e">' + req.subject + '</td></tr>' if req.subject else ''}
            </table>
            <hr style="border:none;border-top:1px solid #e0e7ff;margin:20px 0">
            <p style="color:#374151;font-size:14px;line-height:1.7;white-space:pre-wrap;margin:0">{req.message}</p>
          </div>
          <div style="padding:16px 32px;background:#f5f7ff;font-size:11px;color:#9ca3af">
            Sent via HisabFlow Contact Form
          </div>
        </div>"""

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[HisabFlow] {req.subject or f'Message from {req.name}'}"
        msg["From"] = f"HisabFlow <{settings.smtp_user}>"
        msg["To"] = settings.contact_to
        msg["Reply-To"] = req.email
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.smtp_user, settings.smtp_pass)
            server.sendmail(settings.smtp_user, settings.contact_to, msg.as_string())
        return True
    except Exception as exc:
        logger.error("Email send failed: %s", exc)
        return False


@router.post("/contact")
def submit_contact(req: ContactRequest, db: Session = Depends(get_db)):
    sent = _send_email(req)

    db.add(ContactMessage(
        name=req.name,
        email=req.email,
        subject=req.subject or None,
        message=req.message,
        email_sent=sent,
    ))
    db.commit()

    return {"ok": True, "email_sent": sent}
