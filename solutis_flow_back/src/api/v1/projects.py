from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from src.database import get_db_session
from src.models import Project

projects_router = APIRouter(prefix="/projects", tags=["projects"])


@projects_router.get("", response_model=List[Project])
def list_projects(db: Session = Depends(get_db_session)):
    return db.exec(select(Project)).all()
