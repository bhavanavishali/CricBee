from sqlalchemy.orm import Session
from app.models.admin.plan_pricing import TournamentPricingPlan, PlanStatus
from typing import List, Optional
from app.schemas.admin.plan_pricing import (
    TournamentPricingPlanCreate,
    TournamentPricingPlanUpdate,
    TournamentPricingPlanResponse
)


def create_tournament_pricing_plan(
    db: Session,
    plan_data: TournamentPricingPlanCreate
) -> TournamentPricingPlanResponse:
    
    new_plan = TournamentPricingPlan(
        plan_name=plan_data.plan_name,
        plan_range=plan_data.plan_range,
        amount=plan_data.amount,
        status=plan_data.status
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return TournamentPricingPlanResponse.model_validate(new_plan)


def get_all_tournament_pricing_plans(db: Session) -> List[TournamentPricingPlanResponse]:
    
    plans = db.query(TournamentPricingPlan).order_by(TournamentPricingPlan.created_at.desc()).all()
    return [TournamentPricingPlanResponse.model_validate(plan) for plan in plans]


def get_tournament_pricing_plan_by_id(
    db: Session,
    plan_id: int
) -> Optional[TournamentPricingPlanResponse]:
   
    plan = db.query(TournamentPricingPlan).filter(TournamentPricingPlan.id == plan_id).first()
    if not plan:
        return None
    return TournamentPricingPlanResponse.model_validate(plan)


def update_tournament_pricing_plan(
    db: Session,
    plan_id: int,
    plan_data: TournamentPricingPlanUpdate
) -> Optional[TournamentPricingPlanResponse]:
    
    plan = db.query(TournamentPricingPlan).filter(TournamentPricingPlan.id == plan_id).first()
    if not plan:
        return None
    
    # Update fields if provided
    if plan_data.plan_name is not None:
        plan.plan_name = plan_data.plan_name
    if plan_data.plan_range is not None:
        plan.plan_range = plan_data.plan_range
    if plan_data.amount is not None:
        plan.amount = plan_data.amount
    if plan_data.status is not None:
        plan.status = plan_data.status
    
    # updated_at will be automatically set by SQLAlchemy's onupdate
    db.commit()
    db.refresh(plan)
    return TournamentPricingPlanResponse.model_validate(plan)


def update_tournament_pricing_plan_status(
    db: Session,
    plan_id: int,
    status: str
) -> Optional[TournamentPricingPlanResponse]:
    
    plan = db.query(TournamentPricingPlan).filter(TournamentPricingPlan.id == plan_id).first()
    if not plan:
        return None
    
    plan.status = status
    # updated_at will be automatically set by SQLAlchemy's onupdate
    db.commit()
    db.refresh(plan)
    return TournamentPricingPlanResponse.model_validate(plan)


