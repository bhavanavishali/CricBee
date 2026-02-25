# app/services/email_service.py
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM")

async def send_otp_email(email: str, otp: str, full_name: str) -> bool:
   
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "Your OTP for Account Verification"
        message["From"] = SMTP_FROM
        message["To"] = email

        # Create HTML content
        html = f"""
        <html>
            <body>
                <h2>Welcome {full_name}!</h2>
                <p>Thank you for signing up. Please use the following OTP to verify your account:</p>
                <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">{otp}</h1>
                <p>This OTP will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <br>
                <p>Best regards,<br>Your App Team</p>
            </body>
        </html>
        """
        
        text = f"""
        Welcome {full_name}!
        
        Thank you for signing up. Please use the following OTP to verify your account:
        
        {otp}
        
        This OTP will expire in 10 minutes.
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        Your App Team
        """
        
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")
        
        message.attach(part1)
        message.attach(part2)
        
        # Send email
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True
        )
        
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


async def send_password_reset_email(email: str, reset_token: str, full_name: str, frontend_url: str = "http://localhost:5173") -> bool:

    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "Reset Your CricB Password"
        message["From"] = SMTP_FROM
        message["To"] = email

        
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"
        
        
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #14b8a6;">Password Reset Request</h2>
                    <p>Hello {full_name},</p>
                    <p>We received a request to reset your password for your CricB account.</p>
                    <p>Click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_url}" 
                           style="background-color: #14b8a6; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #14b8a6;">{reset_url}</p>
                    <p><strong>This link will expire in 1 hour.</strong></p>
                    <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                    <br>
                    <p>Best regards,<br>CricB Team</p>
                </div>
            </body>
        </html>
        """
        
        text = f"""
        Password Reset Request
        
        Hello {full_name},
        
        We received a request to reset your password for your CricB account.
        
        Click the following link to reset your password:
        {reset_url}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        
        Best regards,
        CricB Team
        """
        
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")
        
        message.attach(part1)
        message.attach(part2)
        
        # Send email
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True
        )
        
        return True
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        return False