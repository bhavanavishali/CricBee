import razorpay
import hmac
import hashlib
from decimal import Decimal
from app.core.config import settings

# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))

def create_razorpay_order(amount: Decimal, receipt: str = None, currency: str = "INR") -> dict:

    try:
        # Convert Decimal to paise (multiply by 100)
        amount_in_paise = int(float(amount) * 100)
        
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
    except Exception as e:
        raise ValueError(f"Failed to create Razorpay order: {str(e)}")

def verify_payment_signature(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
    
    try:
        # Create the message to verify
        message = f"{razorpay_order_id}|{razorpay_payment_id}"
        
        # Generate expected signature
        expected_signature = hmac.new(
            settings.razorpay_key_secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures
        return hmac.compare_digest(expected_signature, razorpay_signature)
    except Exception as e:
        print(f"Error verifying payment signature: {e}")
        return False

def get_payment_details(razorpay_payment_id: str) -> dict:
    
    try:
        payment = razorpay_client.payment.fetch(razorpay_payment_id)
        return payment
    except Exception as e:
        raise ValueError(f"Failed to fetch payment details: {str(e)}")


