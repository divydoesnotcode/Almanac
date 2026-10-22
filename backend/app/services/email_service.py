"""Email delivery service using fastapi-mail and Google SMTP.

Sends password recovery emails and transaction/system notifications.
"""

from __future__ import annotations

import html
import logging
from typing import Any

from backend.app.config import settings

logger = logging.getLogger(__name__)

# Check fastapi-mail availability
try:
    from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
    _FASTAPI_MAIL_AVAILABLE = True
except ImportError:
    _FASTAPI_MAIL_AVAILABLE = False
    logger.warning("fastapi-mail is not installed. Will use smtplib fallback if needed.")


def get_mail_config() -> Any:
    """Return ConnectionConfig for fastapi-mail configured for Gmail/Google SMTP."""
    if not _FASTAPI_MAIL_AVAILABLE:
        return None

    # Determine MAIL_FROM and sanitize credentials
    mail_from = (settings.MAIL_FROM or settings.MAIL_USERNAME or "noreply@thealmanac.app").strip()
    username = (settings.MAIL_USERNAME or "").strip()
    password = (settings.MAIL_PASSWORD or "").replace(" ", "").strip()

    return ConnectionConfig(
        MAIL_USERNAME=username,
        MAIL_PASSWORD=password,
        MAIL_FROM=mail_from,
        MAIL_PORT=settings.MAIL_PORT,
        MAIL_SERVER=settings.MAIL_SERVER.strip(),
        MAIL_STARTTLS=settings.MAIL_STARTTLS,
        MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
        MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
        USE_CREDENTIALS=bool(username and password),
        VALIDATE_CERTS=True,
    )


def generate_password_reset_html(
    *,
    user_name: str,
    to_email: str,
    reset_url: str,
    expiry_minutes: int = 30,
) -> str:
    """Generate a password recovery email styled after The Almanac's auth terminal UI in a crisp white theme."""
    safe_name = html.escape(user_name or "Ledger Identity")
    safe_email = html.escape(to_email)
    safe_url = html.escape(reset_url)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>The Almanac — Recovery Protocol</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f5f2; color: #1c1915; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f5f2; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        
        <!-- Outer Frame (Max Width 580px) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; width: 100%; border: 1px solid #e5e1d8; background-color: #ffffff; box-shadow: 0 4px 20px rgba(28, 25, 21, 0.05);">
          
          <!-- Top Bar (Mirrors auth-top) -->
          <tr>
            <td style="padding: 14px 20px; border-bottom: 1px solid #e5e1d8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="color: #1c1915; font-weight: 600;">
                    CFO <span style="color: #c45c26;">//</span> AUTH
                  </td>
                  <td align="right" style="color: #766e65; font-size: 10px;">
                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: #407354; margin-right: 4px; vertical-align: middle;"></span>
                    <span style="color: #1c1915;">SYS.READY</span>
                    <span style="color: #d6d0c4; margin: 0 6px;">|</span>
                    NODE <b style="color: #1c1915;">01</b>
                    <span style="color: #d6d0c4; margin: 0 6px;">|</span>
                    INR
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Stage Hero Copy (Mirrors auth-copy) -->
          <tr>
            <td style="padding: 36px 28px 24px 28px;">
              <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #c45c26; margin-bottom: 12px; font-weight: 600;">
                01 / RECOVERY
              </div>
              <h1 style="margin: 0 0 12px 0; font-family: 'Times New Roman', Times, Georgia, serif; font-size: 34px; line-height: 1.15; font-weight: normal; color: #1c1915; letter-spacing: -0.02em;">
                Reset Your Account<br>
              </h1>
            </td>
          </tr>

          <!-- Center Technical Panel (Mirrors auth-panel with corner brackets) -->
          <tr>
            <td style="padding: 0 28px 28px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f6; border: 1px solid #e5e1d8; position: relative;">
                
                <!-- Panel Header (Mirrors auth-panel-head) -->
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #eae6de; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="left" style="color: #1c1915; font-weight: 600;">
                          02 / IDENTIFICATION
                        </td>
                        <td align="right" style="color: #766e65; font-size: 10px;">
                          FORM / RECOVERY
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Panel Content -->
                <tr>
                  <td style="padding: 24px 20px;">
                    
                    <!-- Identity Target Box -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border: 1px solid #e5e1d8; background-color: #ffffff;">
                      <tr>
                        <td style="padding: 12px 14px;">
                          <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #766e65; margin-bottom: 4px;">
                            LEDGER IDENTITY
                          </div>
                          <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; color: #1c1915;">
                            {safe_name} <span style="color: #766e65;">&lt;{safe_email}&gt;</span>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #564e45;">
                      We received a password reset request for your The Almanac access key. To establish a new password and restore ledger authorization, proceed with the button below:
                    </p>

                    <!-- Submit Button (Mirrors auth-submit) -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <tr>
                        <td align="center">
                          <a href="{safe_url}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; box-sizing: border-box; background-color: #c45c26; color: #ffffff !important; text-decoration: none; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; padding: 16px 24px; text-align: center; border: 1px solid #c45c26; border-radius: 0;">
                            RESET ACCESS KEY &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Security / Expiry Notice Box -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #f0ccb9; background-color: #fff6f0; margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 12px 14px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; line-height: 1.5; color: #564e45;">
                          <span style="color: #c45c26; font-weight: 600;">SECURITY PROTOCOL:</span>
                          This link will self-terminate in <strong style="color: #1c1915;">{expiry_minutes} minutes</strong>. If you did not initiate this request, your credentials remain unaffected.
                        </td>
                      </tr>
                    </table>

                    <!-- Manual URL Fallback -->
                    <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; color: #766e65; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px;">
                      F.LINK / MANUAL OVERRIDE
                    </div>
                    <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; line-height: 1.5; word-break: break-all; padding: 10px 12px; background-color: #ffffff; border: 1px solid #e5e1d8;">
                      <a href="{safe_url}" target="_blank" rel="noopener noreferrer" style="color: #c45c26; text-decoration: underline;">{safe_url}</a>
                    </div>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom Footer Bar (Mirrors auth-foot) -->
          <tr>
            <td style="padding: 14px 20px; border-top: 1px solid #e5e1d8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #766e65;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left">
                    AUTH.SERVICE &middot; ENCRYPTED
                  </td>
                  <td align="right">
                    CHANNEL &middot; HTTPS &middot; v0.1.0
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- End Outer Frame -->

      </td>
    </tr>
  </table>
</body>
</html>
"""


async def send_password_reset_email(
    *,
    to_email: str,
    user_name: str,
    reset_url: str,
) -> None:
    """Send password reset instructions to the given user email using Google SMTP.
    
    Uses fastapi-mail if installed; falls back to standard smtplib over SSL if needed.
    """
    html_content = generate_password_reset_html(
        user_name=user_name,
        to_email=to_email,
        reset_url=reset_url,
        expiry_minutes=settings.RESET_PASSWORD_TOKEN_EXPIRE_MINUTES,
    )
    subject = "Reset your The Almanac password"

    if _FASTAPI_MAIL_AVAILABLE:
        config = get_mail_config()
        message = MessageSchema(
            subject=subject,
            recipients=[to_email],
            body=html_content,
            subtype=MessageType.html,
        )
        fm = FastMail(config)
        logger.info("Sending password reset email via fastapi-mail to %s", to_email)
        await fm.send_message(message)
        logger.info("Password reset email sent successfully to %s", to_email)
        return

    # Fallback to smtplib in an async thread
    import asyncio
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    def _send_sync() -> None:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM or settings.MAIL_USERNAME}>"
        msg["To"] = to_email

        # Attach plain text and HTML
        text_part = MIMEText(
            f"Reset your password by following this link: {reset_url}\n"
            f"This link expires in {settings.RESET_PASSWORD_TOKEN_EXPIRE_MINUTES} minutes.",
            "plain",
        )
        html_part = MIMEText(html_content, "html")
        msg.attach(text_part)
        msg.attach(html_part)

        username = (settings.MAIL_USERNAME or "").strip()
        password = (settings.MAIL_PASSWORD or "").replace(" ", "").strip()
        from_email = (settings.MAIL_FROM or username).strip()

        if settings.MAIL_SSL_TLS:
            with smtplib.SMTP_SSL(settings.MAIL_SERVER.strip(), settings.MAIL_PORT, timeout=15) as server:
                if username and password:
                    server.login(username, password)
                server.sendmail(from_email, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(settings.MAIL_SERVER.strip(), settings.MAIL_PORT, timeout=15) as server:
                if settings.MAIL_STARTTLS:
                    server.starttls()
                if username and password:
                    server.login(username, password)
                server.sendmail(from_email, [to_email], msg.as_string())

    logger.info("Sending password reset email via smtplib fallback to %s", to_email)
    await asyncio.to_thread(_send_sync)
    logger.info("Password reset email sent successfully via smtplib fallback to %s", to_email)
