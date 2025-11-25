git # app/services/email_service.py
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