import os
import uuid
from typing import Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import UploadFile

from app.core.config import settings

_s3_client = None


def _ensure_configuration() -> None:
    required = [
        settings.aws_access_key_id,
        settings.aws_secret_access_key,
        settings.aws_s3_bucket,
        settings.aws_s3_region,
    ]
    if not all(required):
        raise RuntimeError(
            "AWS S3 is not fully configured. Please set aws_access_key_id, "
            "aws_secret_access_key, aws_s3_bucket, and aws_s3_region in the environment."
        )


def _get_s3_client():
    global _s3_client
    if _s3_client is None:
        _ensure_configuration()
        _s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_s3_region,
        )
    return _s3_client


def upload_file_to_s3(file: UploadFile, folder: Optional[str] = None) -> str:

    try:
        client = _get_s3_client()
        folder_name = folder or settings.aws_s3_organization_folder
        _, ext = os.path.splitext(file.filename or "")
        extension = ext if ext else ".bin"
        object_key = f"{folder_name}/{uuid.uuid4().hex}{extension}"

        
        file.file.seek(0)
        
       
        file_content = file.file.read()
        
       
        file.file.seek(0)

        try:
            client.put_object(
                Bucket=settings.aws_s3_bucket,
                Key=object_key,
                Body=file_content,
                ContentType=file.content_type or "application/octet-stream"
                
            )
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_message = e.response.get('Error', {}).get('Message', str(e))
            raise RuntimeError(
                f"Failed to upload to S3: {error_code} - {error_message}. "
                f"Check your AWS credentials and bucket permissions."
            ) from e
        except BotoCoreError as e:
            raise RuntimeError(f"Boto3 error: {str(e)}") from e

        region = settings.aws_s3_region
        bucket = settings.aws_s3_bucket
        return f"https://{bucket}.s3.{region}.amazonaws.com/{object_key}"
    
    except RuntimeError:
        
        raise
    except Exception as e:
        raise RuntimeError(f"Unexpected error uploading file: {str(e)}") from e