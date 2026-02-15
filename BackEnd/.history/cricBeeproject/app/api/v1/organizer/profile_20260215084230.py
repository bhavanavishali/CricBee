
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.services.auth_service import *
from app.schemas.organizer import (OrganizationCreate, OrganizationUpdate, OrganizationRead, ProfileResponse, ProfileUpdate)
from app.services.organization_service import (
    get_profile,
    create_organization,
    update_organization,
    get_organization,
    update_organization_image,
)
from app.utils.jwt import get_current_user 
from fastapi import Form
from app.core.config import settings
from app.services.s3_service import upload_file_to_s3

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("/", response_model=ProfileResponse)
def get_profile_endpoint(request: Request, db: Session = Depends(get_db)):
  
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only organizers can access this profile"
        )

    return get_profile(db, current_user.id)

@router.patch("/", response_model=ProfileResponse)
def update_profile_endpoint(
    payload: ProfileUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can update their profile",
        )

    if not payload.user and not payload.organization:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nothing to update",
        )

    try:
      
        if payload.user:
            update_user(db, current_user.id, payload.user)
        
        # Update organization details if provided
        if payload.organization:
            org = get_organization(db, current_user.id)
            if not org:
                raise ValueError("Organization not found")
            update_organization(db, org.id, payload.organization, current_user.id)
        
        # Return updated profile
        return get_profile(db, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

@router.post("/organization", response_model=OrganizationRead, status_code=status.HTTP_201_CREATED)
async def create_organization_endpoint(
    request: Request,
    organization_name: str = Form(...),
    location: str = Form(...),
    bio: str = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only organizers can create organizations"
        )
    
    
    image_url = None
    if file:
        if file.content_type is None or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image uploads are allowed",
            )
        try:
            folder = f"{settings.aws_s3_organization_folder}/{current_user.id}"
            image_url = upload_file_to_s3(file, folder=folder)
        except RuntimeError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload image: {str(exc)}",
            )
    
    try:
        payload = OrganizationCreate(
            organization_name=organization_name,
            location=location,
            bio=bio,
            organization_image=image_url
        )
        org = create_organization(db, payload, current_user.id)
        return org
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/organization/{org_id}/image", response_model=OrganizationRead)
async def upload_organization_image_endpoint(
    org_id: int,
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can upload organization images",
        )

    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided",
        )

    if file.content_type is None or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image uploads are allowed",
        )

    try:
        org = update_organization_image(db, org_id, current_user.id, file)
        return org
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except RuntimeError as exc:
        # Log the full error for debugging
        import logging
        logging.error(f"S3 upload error: {str(exc)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(exc)}",
        )
    except Exception as exc:
        import logging
        logging.error(f"Unexpected error: {str(exc)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(exc)}",
        )

@router.patch("/organization/{org_id}", response_model=OrganizationRead)
def update_organization_endpoint(
    org_id: int,
    payload: OrganizationUpdate,
    request: Request,
    db: Session = Depends(get_db)
):

    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only organizers can update organizations"
        )
    try:
        org = update_organization(db, org_id, payload, current_user.id)
        return org
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

