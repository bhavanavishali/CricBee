# app/organizer/services.py
from sqlalchemy.orm import Session
from app.models.organizer import OrganizationDetails
from app.models.user import User, UserRole
from app.schemas.organizer import OrganizationCreate, OrganizationUpdate, OrganizationRead, ProfileResponse
from app.schemas.user import UserRead

def get_organization(db: Session, user_id: int) -> OrganizationDetails | None:
    return db.query(OrganizationDetails).filter(OrganizationDetails.user_id == user_id).first()

def create_organization(db: Session, payload: OrganizationCreate, user_id: int) -> OrganizationDetails:
    existing_org = get_organization(db, user_id)
    if existing_org:
        raise ValueError("Organization already exists for this user")
    
    org = OrganizationDetails(
        user_id=user_id,
        organization_name=payload.organization_name,
        location=payload.location,
        bio=payload.bio,
        active=True
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

def update_organization(db: Session, org_id: int, payload: OrganizationUpdate, user_id: int) -> OrganizationDetails:
    org = db.query(OrganizationDetails).filter(
        OrganizationDetails.id == org_id, 
        OrganizationDetails.user_id == user_id
    ).first()
    if not org:
        raise ValueError("Organization not found or access denied")
    
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(org, field, value)
    
    db.commit()
    db.refresh(org)
    return org

def get_profile(db: Session, user_id: int) -> ProfileResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    org = get_organization(db, user_id)
    return ProfileResponse(
        user=UserRead.model_validate(user),  # Adjust for Pydantic v2 if needed (e.g., UserRead.model_validate(user))
        organization=OrganizationRead.model_validate(org) if org else None
    )