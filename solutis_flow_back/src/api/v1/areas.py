from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from src.database import get_db_session
from src.models import Area, CostCenter

areas_router = APIRouter(tags=["areas"])


@areas_router.get("/areas", response_model=List[Area])
def list_areas(db: Session = Depends(get_db_session)):
    return db.exec(select(Area)).all()


@areas_router.get("/cost-centers", response_model=List[CostCenter])
def list_cost_centers(db: Session = Depends(get_db_session)):
    return db.exec(select(CostCenter)).all()
