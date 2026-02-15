import razorpay
import hmac
import hashlib
from decimal import Decimal
from app.core.config import settings


def get_razorpay_client():
    
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise ValueError("Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.")
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))

def create_razorpay_order(amount: Decimal, receipt: str = None, currency: str = "INR") -> dict:
    try:
        razorpay_client = get_razorpay_client()
        
        
        amount_in_paise = int(float(amount) * 100)
        
        if amount_in_paise <= 0:
            raise ValueError("Amount must be greater than 0")
        
        order_data = {
            "amount": amount_in_paise,
            "currency": currency,
            "receipt": receipt or f"receipt_{hash(str(amount))}",
            "notes": {
                "description": "Tournament registration payment"
            }
        }
        
        order = razorpay_client.order.create(data=order_data)
        
        return {
            "id": order["id"],
            "amount": amount,
            "currency": currency,
            "receipt": order.get("receipt"),
            "status": order.get("status")
        }
    except ValueError as e:
        
        raise
    except Exception as e:
        raise ValueError(f"Failed to create Razorpay order: {str(e)}")

def verify_payment_signature(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
    try:
        if not settings.razorpay_key_secret:
            raise ValueError("Razorpay key secret not configured")
        
        # Create the message to verify
        message = f"{razorpay_order_id}|{razorpay_payment_id}"
        
        # Generate expected signature
        expected_signature = hmac.new(
            settings.razorpay_key_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        

        return hmac.compare_digest(expected_signature, razorpay_signature)
    except Exception as e:
        import logging
        logging.error(f"Error verifying payment signature: {e}")
        return False

def get_payment_details(razorpay_payment_id: str) -> dict:
    try:
        razorpay_client = get_razorpay_client()
        payment = razorpay_client.payment.fetch(razorpay_payment_id)
        return payment
    except ValueError as e:
        raise
    except Exception as e:
        raise ValueError(f"Failed to fetch payment details: {str(e)}")


