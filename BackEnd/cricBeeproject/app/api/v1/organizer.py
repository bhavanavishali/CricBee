
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.organizer import (
    OrganizationCreate, OrganizationUpdate, OrganizationRead, ProfileResponse
)
from app.services.organization_service import (
    get_profile, create_organization, update_organization
)
from app.utils.jwt import get_current_user  # From the new auth utils

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("/", response_model=ProfileResponse)
def get_profile_endpoint(request: Request, db: Session = Depends(get_db)):
    """
    Fetch the current user's profile, including basic details and optional organization details.
    Frontend can use this to display details or show create form if organization is None.
    """
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only organizers can access this profile"
        )
    return get_profile(db, current_user.id)

@router.post("/organization", response_model=OrganizationRead, status_code=status.HTTP_201_CREATED)
def create_organization_endpoint(
    payload: OrganizationCreate, 
    request: Request, 
    db: Session = Depends(get_db)
):
    """
    Create an organization for the signed-in organizer (only if none exists).
    """
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only organizers can create organizations"
        )
    try:
        org = create_organization(db, payload, current_user.id)
        return org
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/organization/{org_id}", response_model=OrganizationRead)
def update_organization_endpoint(
    org_id: int,
    payload: OrganizationUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Update the organizer's organization details (via Edit button).
    """
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