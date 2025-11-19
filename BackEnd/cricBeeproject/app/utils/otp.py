# app/utils/otp.py
import random
import string
from datetime import timedelta

def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP"""
    return ''.join(random.choices(string.digits, k=length))

def get_otp_key(email: str) -> str:
    """Generate Redis key for OTP"""
    return f"otp:{email}"

def store_otp_in_redis(redis_client, email: str, otp: str, expire_minutes: int = 10) -> bool:
    """Store OTP in Redis with expiration"""
    try:
        key = get_otp_key(email)
        redis_client.setex(key, timedelta(minutes=expire_minutes), otp)
        return True
    except Exception as e:
        print(f"Error storing OTP in Redis: {e}")
        return False

def verify_otp_from_redis(redis_client, email: str, otp: str) -> bool:
    """Verify OTP from Redis"""
    try:
        key = get_otp_key(email)
        stored_otp = redis_client.get(key)
        if stored_otp and stored_otp == otp:
            # Delete OTP after successful verification
            redis_client.delete(key)
            return True
        return False
    except Exception as e:
        print(f"Error verifying OTP: {e}")
        return False

def delete_otp_from_redis(redis_client, email: str) -> bool:
    """Delete OTP from Redis"""
    try:
        key = get_otp_key(email)
        redis_client.delete(key)
        return True
    except Exception as e:
        print(f"Error deleting OTP: {e}")
        return False