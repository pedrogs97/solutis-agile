from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from src.database import get_db_session
from src.models import Demand, DemandStatus
from src.security import AuthenticatedUser, get_current_user

dashboard_router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@dashboard_router.get("/metrics")
def get_dashboard_metrics(
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Return executive dashboard metrics for productivity, delays and workload."""
    all_demands = db.exec(select(Demand)).all()

    total = len(all_demands)
    pending = sum(1 for d in all_demands if d.status == DemandStatus.PENDENTE)
    in_progress = sum(1 for d in all_demands if d.status == DemandStatus.EM_ANDAMENTO)
    completed = sum(1 for d in all_demands if d.status == DemandStatus.CONCLUIDO)

    total_estimated = sum(d.time_estimated_hours for d in all_demands)
    total_spent = sum(d.time_spent_hours for d in all_demands)

    return {
        "total_demands": total,
        "pending": pending,
        "in_progress": in_progress,
        "completed": completed,
        "total_estimated_hours": total_estimated,
        "total_spent_hours": total_spent,
    }
