from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from src.database import get_db_session
from src.models import (
    Demand,
    DemandObserver,
    DemandStatus,
    ApprovalStatus,
    TransferRequest,
    TransferStatus,
    Feedback,
)
from src.schemas.demand import (
    DemandCreate,
    DemandResponse,
    DemandStatusUpdate,
    TransferCreate,
    FeedbackCreate,
)
from src.security import AuthenticatedUser, get_current_user
from src.events.actors import process_domain_event_actor

demands_router = APIRouter(prefix="/demands", tags=["demands"])


def get_demand_allowed_user_ids(db: Session, demand: Demand) -> List[int]:
    """Retrieve all user IDs with permission to view/interact with the demand."""
    observers = db.exec(
        select(DemandObserver).where(DemandObserver.demand_id == demand.id)
    ).all()

    user_ids = {demand.solicitor_user_id, demand.manager_user_id}
    if demand.assignee_user_id:
        user_ids.add(demand.assignee_user_id)
    for obs in observers:
        user_ids.add(obs.observer_user_id)

    return list(user_ids)


@demands_router.post("", response_model=DemandResponse, status_code=status.HTTP_201_CREATED)
def create_demand(
    demand_in: DemandCreate,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Create a new demand and trigger domain event."""
    demand = Demand(
        type=demand_in.type,
        title=demand_in.title,
        description=demand_in.description,
        solicitor_user_id=current_user.id,
        assignee_user_id=demand_in.assignee_user_id,
        manager_user_id=demand_in.manager_user_id,
        priority=demand_in.priority,
        status=DemandStatus.PENDENTE,
        approval_status=ApprovalStatus.NENHUMA,
        sla_limit_hours=demand_in.sla_limit_hours,
        due_date=demand_in.due_date,
        time_estimated_hours=demand_in.time_estimated_hours,
        area_id=demand_in.area_id,
        cost_center_id=demand_in.cost_center_id,
        project_id=demand_in.project_id,
    )
    db.add(demand)
    db.commit()
    db.refresh(demand)

    # Save observers
    observer_ids = list(set(demand_in.observer_user_ids))
    for obs_id in observer_ids:
        obs = DemandObserver(demand_id=demand.id, observer_user_id=obs_id)
        db.add(obs)
    db.commit()

    allowed_users = get_demand_allowed_user_ids(db, demand)

    # Trigger Dramatiq Event
    try:
        process_domain_event_actor.send(
            event_type="DemandCreated",
            demand_id=demand.id,
            title=demand.title,
            status=demand.status.value,
            allowed_user_ids=allowed_users,
            message=f"Nova demanda criada: '{demand.title}'",
        )
    except Exception:
        pass

    response_data = DemandResponse.model_validate(demand)
    response_data.observer_user_ids = observer_ids
    return response_data


@demands_router.get("", response_model=List[DemandResponse])
def list_demands(
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """List all demands visible to the current authenticated user."""
    # Find demands where user is solicitor, assignee, manager, or observer
    observer_demand_ids = db.exec(
        select(DemandObserver.demand_id).where(
            DemandObserver.observer_user_id == current_user.id
        )
    ).all()

    demands = db.exec(
        select(Demand).where(
            (Demand.solicitor_user_id == current_user.id)
            | (Demand.assignee_user_id == current_user.id)
            | (Demand.manager_user_id == current_user.id)
            | (Demand.id.in_(observer_demand_ids))
        )
    ).all()

    results = []
    for d in demands:
        obs = db.exec(
            select(DemandObserver.observer_user_id).where(DemandObserver.demand_id == d.id)
        ).all()
        resp = DemandResponse.model_validate(d)
        resp.observer_user_ids = obs
        results.append(resp)

    return results


@demands_router.get("/{demand_id}", response_model=DemandResponse)
def get_demand(
    demand_id: int,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get single demand details with permission validation."""
    demand = db.get(Demand, demand_id)
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")

    allowed_users = get_demand_allowed_user_ids(db, demand)
    if current_user.id not in allowed_users and current_user.group_name != "admin":
        raise HTTPException(status_code=403, detail="Acesso não autorizado para esta demanda")

    obs = db.exec(
        select(DemandObserver.observer_user_id).where(DemandObserver.demand_id == demand.id)
    ).all()
    resp = DemandResponse.model_validate(demand)
    resp.observer_user_ids = obs
    return resp


@demands_router.patch("/{demand_id}/status", response_model=DemandResponse)
def update_demand_status(
    demand_id: int,
    status_in: DemandStatusUpdate,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Update demand status with STRICT validation rule:
    Moving to CONCLUIDO REQUIRES evidence description or proof document!
    """
    demand = db.get(Demand, demand_id)
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")

    allowed_users = get_demand_allowed_user_ids(db, demand)
    if current_user.id not in allowed_users and current_user.group_name != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado para alterar o status")

    # STRICT RULE: Mandatory evidence for CONCLUIDO
    if status_in.status == DemandStatus.CONCLUIDO:
        evidence = status_in.evidence_description or demand.evidence_description
        if not evidence or not evidence.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A conclusão da atividade exige obrigatoriamente uma descrição de evidência ou anexo de prova.",
            )
        demand.evidence_description = evidence.strip()
        if status_in.evidence_attachment_id:
            demand.evidence_attachment_id = status_in.evidence_attachment_id

    demand.status = status_in.status
    db.add(demand)
    db.commit()
    db.refresh(demand)

    # Dispatch event via Dramatiq
    try:
        process_domain_event_actor.send(
            event_type="StatusUpdated",
            demand_id=demand.id,
            title=demand.title,
            status=demand.status.value,
            allowed_user_ids=allowed_users,
            message=f"Status da demanda #{demand.id} alterado para '{demand.status.value}'",
        )
    except Exception:
        pass

    obs = db.exec(
        select(DemandObserver.observer_user_id).where(DemandObserver.demand_id == demand.id)
    ).all()
    resp = DemandResponse.model_validate(demand)
    resp.observer_user_ids = obs
    return resp


@demands_router.post("/{demand_id}/transfer", status_code=201)
def request_transfer(
    demand_id: int,
    transfer_in: TransferCreate,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Request demand transfer to another assignee with mandatory justification."""
    demand = db.get(Demand, demand_id)
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")

    if not transfer_in.justification or not transfer_in.justification.strip():
        raise HTTPException(status_code=400, detail="A transferência exige justificativa obrigatória")

    transfer = TransferRequest(
        demand_id=demand.id,
        previous_assignee_user_id=demand.assignee_user_id or current_user.id,
        target_assignee_user_id=transfer_in.target_assignee_user_id,
        justification=transfer_in.justification.strip(),
        status=TransferStatus.PENDING,
    )
    db.add(transfer)
    db.commit()
    db.refresh(transfer)

    allowed_users = get_demand_allowed_user_ids(db, demand)
    try:
        process_domain_event_actor.send(
            event_type="TransferRequested",
            demand_id=demand.id,
            title=demand.title,
            status=demand.status.value,
            allowed_user_ids=allowed_users,
            message=f"Solicitação de transferência criada para a demanda #{demand.id}",
        )
    except Exception:
        pass

    return {"message": "Solicitação de transferência registrada com sucesso", "transfer_id": transfer.id}


@demands_router.post("/{demand_id}/feedback", status_code=201)
def submit_feedback(
    demand_id: int,
    feedback_in: FeedbackCreate,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Manager submits execution feedback for completed demand."""
    demand = db.get(Demand, demand_id)
    if not demand:
        raise HTTPException(status_code=404, detail="Demanda não encontrada")

    if demand.manager_user_id != current_user.id and current_user.group_name != "admin":
        raise HTTPException(status_code=403, detail="Apenas o gestor responsável pode avaliar a execução")

    fb = Feedback(
        demand_id=demand.id,
        manager_user_id=current_user.id,
        rating=feedback_in.rating,
        comment=feedback_in.comment,
        is_negative=feedback_in.is_negative,
    )
    db.add(fb)
    db.commit()

    return {"message": "Feedback do gestor registrado com sucesso"}
