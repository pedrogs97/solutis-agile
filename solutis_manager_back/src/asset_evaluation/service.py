"""Service layer for FO-PAT-02 Asset Technical Evaluation"""

import os
import random
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from src.asset.enums import AssetStatusEnum
from src.asset.models import AssetModel, AssetStatusModel
from src.asset_evaluation.models import (
    AssetCatalogComponentModel,
    AssetEvaluationAttachmentModel,
    AssetEvaluationComponentModel,
    AssetTechnicalEvaluationModel,
)
from src.asset_evaluation.schemas import (
    AssetEvaluationApproveSchema,
    AssetEvaluationCreateSchema,
    AssetEvaluationMetricsSchema,
    AssetEvaluationOutSchema,
    AssetEvaluationUpdateSchema,
    AttachmentOutSchema,
    ComponentItemOutSchema,
)
from src.auth.models import UserModel
from src.config import BASE_DIR, DEBUG
from src.utils import upload_file

BASE_CATALOG_COMPONENTS = [
    "RAM",
    "SSD",
    "HD",
    "Fonte",
    "CPU",
    "Placa-mãe",
    "Tela",
    "Bateria",
    "Cabos",
    "Teclado",
    "Mouse",
    "Estrutura metálica",
    "Madeira",
    "Ferragens",
    "Rodízios",
    "Prateleiras",
    "Outros",
]


class AssetEvaluationService:
    """Regras de negócio para Avaliação Técnica e Baixa Patrimonial (FO-PAT-02)."""

    def generate_protocol(self, db_session: Session) -> str:
        """Gera protocolo sequencial e único no formato FO-PAT-02-YYYYMMDD-XXXX."""
        now = datetime.now()
        ymd = now.strftime("%Y%m%d")

        for _ in range(20):
            rand_suffix = f"{random.randint(1000, 9999)}"
            protocol = f"FO-PAT-02-{ymd}-{rand_suffix}"
            exists = (
                db_session.query(AssetTechnicalEvaluationModel.id)
                .filter(AssetTechnicalEvaluationModel.protocol == protocol)
                .first()
            )
            if not exists:
                return protocol

        unique_suffix = uuid.uuid4().hex[:4].upper()
        return f"FO-PAT-02-{ymd}-{unique_suffix}"

    def ensure_base_components(self, db_session: Session) -> None:
        """Garante que os componentes base existam no catálogo de autocompletar."""
        existing_names = {
            str(c[0]).lower()
            for c in db_session.query(AssetCatalogComponentModel.name).all()
        }
        to_add = [
            AssetCatalogComponentModel(name=base_comp)
            for base_comp in BASE_CATALOG_COMPONENTS
            if base_comp.lower() not in existing_names
        ]
        if to_add:
            db_session.add_all(to_add)
            db_session.commit()

    def get_catalog_components(self, db_session: Session) -> List[Dict[str, Any]]:
        """Lista todos os componentes do catálogo compartilhado."""
        self.ensure_base_components(db_session)
        items = (
            db_session.query(AssetCatalogComponentModel)
            .order_by(AssetCatalogComponentModel.name.asc())
            .all()
        )
        return [
            {"id": item.id, "name": item.name, "created_at": item.created_at}
            for item in items
        ]

    def add_catalog_component(self, db_session: Session, name: str) -> Dict[str, Any]:
        """Adiciona um componente ao catálogo de autocompletar."""
        norm_name = name.strip()
        if not norm_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nome do componente não pode ser vazio.",
            )

        existing = (
            db_session.query(AssetCatalogComponentModel)
            .filter(func.lower(AssetCatalogComponentModel.name) == norm_name.lower())
            .first()
        )
        if existing:
            return {
                "id": existing.id,
                "name": existing.name,
                "created_at": existing.created_at,
            }

        new_comp = AssetCatalogComponentModel(name=norm_name)
        db_session.add(new_comp)
        db_session.commit()
        db_session.refresh(new_comp)
        return {
            "id": new_comp.id,
            "name": new_comp.name,
            "created_at": new_comp.created_at,
        }

    def register_new_components(self, db_session: Session, names: List[str]) -> None:
        """Registra novos componentes no catálogo compartilhado durante o salvamento da matriz."""
        if not names:
            return
        existing_names = {
            str(c[0]).lower()
            for c in db_session.query(AssetCatalogComponentModel.name).all()
        }
        for n in names:
            clean = n.strip()
            if clean and clean.lower() not in existing_names:
                db_session.add(AssetCatalogComponentModel(name=clean))
                existing_names.add(clean.lower())
        db_session.commit()

    def _serialize_evaluation(
        self, evaluation: AssetTechnicalEvaluationModel
    ) -> AssetEvaluationOutSchema:
        """Serializa o modelo ORM para o schema de saída Pydantic."""
        dest_raw = str(getattr(evaluation, "destination_raw", "") or "")
        destinations = [d.strip() for d in dest_raw.split("|") if d.strip()]

        eval_dict = {
            "id": int(getattr(evaluation, "id")),
            "protocol": str(getattr(evaluation, "protocol")),
            "evaluation_date": getattr(evaluation, "evaluation_date"),
            "asset_id": getattr(evaluation, "asset_id"),
            "patrimonio": getattr(evaluation, "patrimonio"),
            "asset_type_name": getattr(evaluation, "asset_type_name"),
            "brand_model": getattr(evaluation, "brand_model"),
            "serial_number": getattr(evaluation, "serial_number"),
            "cost_center": getattr(evaluation, "cost_center"),
            "unity": getattr(evaluation, "unity"),
            "status": str(getattr(evaluation, "status")),
            "classification": getattr(evaluation, "classification"),
            "feasibility": getattr(evaluation, "feasibility"),
            "destination": destinations,
            "gross_weight": float(getattr(evaluation, "gross_weight") or 0.0),
            "reused_weight": float(getattr(evaluation, "reused_weight") or 0.0),
            "discarded_weight": float(getattr(evaluation, "discarded_weight") or 0.0),
            "recycle_weight": float(getattr(evaluation, "recycle_weight") or 0.0),
            "reuse_percentage": float(getattr(evaluation, "reuse_percentage") or 0.0),
            "acquisition_value": float(getattr(evaluation, "acquisition_value") or 0.0),
            "net_book_value": float(getattr(evaluation, "net_book_value") or 0.0),
            "estimated_economy": float(getattr(evaluation, "estimated_economy") or 0.0),
            "justification": getattr(evaluation, "justification"),
            "technical_opinion": getattr(evaluation, "technical_opinion"),
            "evaluator_id": getattr(evaluation, "evaluator_id"),
            "evaluator_name": getattr(evaluation, "evaluator_name"),
            "approver_id": getattr(evaluation, "approver_id"),
            "approver_name": getattr(evaluation, "approver_name"),
            "approval_date": getattr(evaluation, "approval_date"),
            "approval_comments": getattr(evaluation, "approval_comments"),
            "created_at": getattr(evaluation, "created_at"),
            "updated_at": getattr(evaluation, "updated_at"),
            "components": [
                ComponentItemOutSchema(
                    id=int(getattr(c, "id")),
                    evaluation_id=int(getattr(c, "evaluation_id")),
                    name=str(getattr(c, "name")),
                    quantity=int(getattr(c, "quantity")),
                    condition=str(getattr(c, "condition")),
                    destination=str(getattr(c, "destination")),
                    observations=getattr(c, "observations"),
                )
                for c in evaluation.components
            ],
            "attachments": [
                AttachmentOutSchema(
                    id=int(getattr(a, "id")),
                    file_name=str(getattr(a, "file_name")),
                    path=str(getattr(a, "path")),
                    checklist_key=getattr(a, "checklist_key"),
                    created_at=getattr(a, "created_at"),
                )
                for a in evaluation.attachments
            ],
        }
        return AssetEvaluationOutSchema.model_validate(eval_dict)

    def create_evaluation(
        self,
        db_session: Session,
        data: AssetEvaluationCreateSchema,
        authenticated_user: Optional[UserModel] = None,
    ) -> AssetEvaluationOutSchema:
        """Cria uma nova avaliação técnica FO-PAT-02."""
        protocol = data.protocol or self.generate_protocol(db_session)

        # Autopreenchimento a partir do AssetModel se asset_id for informado
        if data.asset_id:
            asset = (
                db_session.query(AssetModel)
                .filter(AssetModel.id == data.asset_id)
                .first()
            )
            if asset:
                if not data.patrimonio:
                    val = getattr(asset, "register_number", None) or getattr(
                        asset, "code", None
                    )
                    data.patrimonio = str(val) if val else None
                if not data.serial_number:
                    val = getattr(asset, "serial_number", None)
                    data.serial_number = str(val) if val else None
                if not data.brand_model:
                    brand = str(getattr(asset, "brand", "") or "")
                    model = str(getattr(asset, "model", "") or "")
                    full = f"{brand} {model}".strip()
                    data.brand_model = full or None
                if (
                    not data.acquisition_value
                    and getattr(asset, "value", None) is not None
                ):
                    data.acquisition_value = float(getattr(asset, "value") or 0.0)
                if not data.asset_type_name and getattr(asset, "type", None):
                    data.asset_type_name = str(asset.type.name)

        destination_str = "|".join([d.strip() for d in data.destination if d.strip()])

        evaluation = AssetTechnicalEvaluationModel(
            protocol=protocol,
            asset_id=data.asset_id,
            patrimonio=data.patrimonio,
            asset_type_name=data.asset_type_name,
            brand_model=data.brand_model,
            serial_number=data.serial_number,
            cost_center=data.cost_center,
            unity=data.unity,
            status=data.status or "Rascunho",
            classification=data.classification,
            feasibility=data.feasibility,
            destination_raw=destination_str,
            gross_weight=data.gross_weight,
            reused_weight=data.reused_weight,
            discarded_weight=data.discarded_weight,
            recycle_weight=data.recycle_weight,
            reuse_percentage=data.reuse_percentage,
            acquisition_value=data.acquisition_value,
            net_book_value=data.net_book_value,
            estimated_economy=data.estimated_economy,
            justification=data.justification,
            technical_opinion=data.technical_opinion,
            evaluator_id=authenticated_user.id if authenticated_user else None,
            evaluator_name=authenticated_user.username if authenticated_user else None,
        )

        db_session.add(evaluation)
        db_session.flush()

        # Matriz de componentes
        if data.components:
            for comp in data.components:
                comp_model = AssetEvaluationComponentModel(
                    evaluation_id=evaluation.id,
                    name=comp.name.strip(),
                    quantity=comp.quantity,
                    condition=comp.condition,
                    destination=comp.destination,
                    observations=comp.observations,
                )
                db_session.add(comp_model)

        # Cadastro de componentes novos digitados pelo usuário no catálogo
        if data.new_components_for_catalog:
            self.register_new_components(db_session, data.new_components_for_catalog)

        db_session.commit()
        db_session.refresh(evaluation)
        return self._serialize_evaluation(evaluation)

    def get_evaluation(
        self, db_session: Session, evaluation_id: int
    ) -> AssetEvaluationOutSchema:
        """Busca uma avaliação pelo ID com componentes e anexos."""
        evaluation = (
            db_session.query(AssetTechnicalEvaluationModel)
            .filter(AssetTechnicalEvaluationModel.id == evaluation_id)
            .first()
        )
        if not evaluation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Avaliação técnica não encontrada.",
            )
        return self._serialize_evaluation(evaluation)

    def update_evaluation(
        self,
        db_session: Session,
        evaluation_id: int,
        data: AssetEvaluationUpdateSchema,
        authenticated_user: Optional[UserModel] = None,
    ) -> AssetEvaluationOutSchema:
        """Atualiza uma avaliação técnica existente."""
        evaluation = (
            db_session.query(AssetTechnicalEvaluationModel)
            .filter(AssetTechnicalEvaluationModel.id == evaluation_id)
            .first()
        )
        if not evaluation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Avaliação técnica não encontrada.",
            )

        update_dict = data.model_dump(exclude_unset=True)

        if "destination" in update_dict:
            dest_list = update_dict.pop("destination") or []
            evaluation.destination_raw = "|".join(
                [d.strip() for d in dest_list if d.strip()]
            )

        # Recalcular % ESG e Economia se pesos ou valores foram atualizados
        gross = update_dict.get("gross_weight", evaluation.gross_weight)
        reused = update_dict.get("reused_weight", evaluation.reused_weight)
        net_book = update_dict.get("net_book_value", evaluation.net_book_value)

        if gross > 0:
            calc_pct = round(min(100.0, max(0.0, (reused / gross) * 100.0)), 2)
            evaluation.reuse_percentage = calc_pct
        else:
            evaluation.reuse_percentage = 0.0

        if net_book > 0 and evaluation.reuse_percentage > 0:
            evaluation.estimated_economy = round(
                net_book * (evaluation.reuse_percentage / 100.0), 2
            )
        else:
            evaluation.estimated_economy = 0.0

        # Componentes
        if "components" in update_dict:
            comps_data = update_dict.pop("components")
            # Remove anteriores
            db_session.query(AssetEvaluationComponentModel).filter(
                AssetEvaluationComponentModel.evaluation_id == evaluation.id
            ).delete()
            if comps_data:
                for comp in comps_data:
                    comp_model = AssetEvaluationComponentModel(
                        evaluation_id=evaluation.id,
                        name=comp["name"].strip(),
                        quantity=comp.get("quantity", 1),
                        condition=comp.get("condition", "Boa"),
                        destination=comp.get("destination", "Reaproveitamento interno"),
                        observations=comp.get("observations"),
                    )
                    db_session.add(comp_model)

        if "new_components_for_catalog" in update_dict:
            new_comps = update_dict.pop("new_components_for_catalog")
            if new_comps:
                self.register_new_components(db_session, new_comps)

        for field, value in update_dict.items():
            if hasattr(evaluation, field):
                setattr(evaluation, field, value)

        db_session.commit()
        db_session.refresh(evaluation)
        return self._serialize_evaluation(evaluation)

    def list_evaluations(
        self,
        db_session: Session,
        page: int = 1,
        size: int = 20,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        date_start: Optional[datetime] = None,
        date_end: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Lista avaliações técnicas com filtros e paginação."""
        query = db_session.query(AssetTechnicalEvaluationModel)

        if status_filter:
            query = query.filter(AssetTechnicalEvaluationModel.status == status_filter)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (AssetTechnicalEvaluationModel.protocol.ilike(search_pattern))
                | (AssetTechnicalEvaluationModel.patrimonio.ilike(search_pattern))
                | (AssetTechnicalEvaluationModel.brand_model.ilike(search_pattern))
                | (AssetTechnicalEvaluationModel.serial_number.ilike(search_pattern))
            )

        if date_start:
            query = query.filter(
                AssetTechnicalEvaluationModel.evaluation_date >= date_start
            )
        if date_end:
            query = query.filter(
                AssetTechnicalEvaluationModel.evaluation_date <= date_end
            )

        total = query.count()
        pages = (total + size - 1) // size if size > 0 else 1
        offset = (page - 1) * size

        evaluations = (
            query.order_by(AssetTechnicalEvaluationModel.created_at.desc())
            .offset(offset)
            .limit(size)
            .all()
        )

        items = [self._serialize_evaluation(ev) for ev in evaluations]
        return {
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": pages,
        }

    def get_metrics(self, db_session: Session) -> AssetEvaluationMetricsSchema:
        """Calcula as métricas agregadas do Painel Executivo."""
        total_evaluations = db_session.query(AssetTechnicalEvaluationModel).count()

        # Agregações de peso e economia
        sums = (
            db_session.query(
                func.coalesce(
                    func.sum(AssetTechnicalEvaluationModel.reused_weight), 0.0
                ),
                func.coalesce(
                    func.sum(AssetTechnicalEvaluationModel.discarded_weight), 0.0
                ),
                func.coalesce(
                    func.sum(AssetTechnicalEvaluationModel.recycle_weight), 0.0
                ),
                func.coalesce(
                    func.sum(AssetTechnicalEvaluationModel.estimated_economy), 0.0
                ),
                func.coalesce(
                    func.avg(AssetTechnicalEvaluationModel.reuse_percentage), 0.0
                ),
            )
            .filter(
                AssetTechnicalEvaluationModel.status.in_(
                    ["Aprovado", "Baixado", "Em avaliação"]
                )
            )
            .first()
        )

        reused_weight = float(sums[0]) if sums else 0.0
        discarded_weight = float(sums[1]) if sums else 0.0
        recycle_weight = float(sums[2]) if sums else 0.0
        estimated_economy = float(sums[3]) if sums else 0.0
        avg_reuse_pct = round(float(sums[4]) if sums else 0.0, 2)

        # Contagem por destino/status
        reused_assets = (
            db_session.query(AssetTechnicalEvaluationModel)
            .filter(
                AssetTechnicalEvaluationModel.destination_raw.ilike(
                    "%Reaproveitamento%"
                )
                | AssetTechnicalEvaluationModel.destination_raw.ilike("%Estoque%")
            )
            .count()
        )

        written_off_assets = (
            db_session.query(AssetTechnicalEvaluationModel)
            .filter(
                (AssetTechnicalEvaluationModel.status == "Baixado")
                | (AssetTechnicalEvaluationModel.destination_raw.ilike("%Descarte%"))
            )
            .count()
        )

        return AssetEvaluationMetricsSchema(
            total_evaluations=total_evaluations,
            total_reused_assets=reused_assets,
            total_written_off_assets=written_off_assets,
            total_reused_weight=round(reused_weight, 2),
            total_discarded_weight=round(discarded_weight, 2),
            total_recycle_weight=round(recycle_weight, 2),
            average_reuse_percentage=avg_reuse_pct,
            total_estimated_economy=round(estimated_economy, 2),
        )

    async def upload_attachment(
        self,
        db_session: Session,
        evaluation_id: int,
        file: UploadFile,
        checklist_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Salva arquivo comprobatório assincronamente e vincula à avaliação."""
        evaluation = (
            db_session.query(AssetTechnicalEvaluationModel)
            .filter(AssetTechnicalEvaluationModel.id == evaluation_id)
            .first()
        )
        if not evaluation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Avaliação técnica não encontrada.",
            )

        file_code = uuid.uuid4().hex
        filename = file.filename or "arquivo.pdf"
        ext = filename.split(".")[-1] if "." in filename else "pdf"
        sanitized_filename = f"{evaluation.protocol}_{file_code}.{ext}"

        upload_dir = (
            os.path.join(BASE_DIR, "storage", "asset_evaluations")
            if DEBUG
            else "/storage/asset_evaluations"
        )
        file_bytes = await file.read()
        file_path = await upload_file(
            sanitized_filename, "evaluations", file_bytes, upload_dir
        )

        attachment = AssetEvaluationAttachmentModel(
            evaluation_id=evaluation.id,
            file_name=filename,
            path=file_path,
            checklist_key=checklist_key,
        )
        db_session.add(attachment)
        db_session.commit()
        db_session.refresh(attachment)

        return {
            "id": attachment.id,
            "file_name": attachment.file_name,
            "path": attachment.path,
            "checklist_key": attachment.checklist_key,
            "created_at": attachment.created_at,
        }

    def approve_evaluation(
        self,
        db_session: Session,
        evaluation_id: int,
        data: AssetEvaluationApproveSchema,
        authenticated_user: Optional[UserModel] = None,
    ) -> AssetEvaluationOutSchema:
        """Aprova a avaliação técnica e opcionalmente efetiva a baixa do ativo."""
        evaluation = (
            db_session.query(AssetTechnicalEvaluationModel)
            .filter(AssetTechnicalEvaluationModel.id == evaluation_id)
            .first()
        )
        if not evaluation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Avaliação técnica não encontrada.",
            )

        new_status = "Baixado" if data.write_off_asset else "Aprovado"
        evaluation.status = new_status
        evaluation.approver_id = authenticated_user.id if authenticated_user else None
        evaluation.approver_name = (
            authenticated_user.username if authenticated_user else "Sistema"
        )
        evaluation.approval_date = datetime.now()
        evaluation.approval_comments = data.comments

        # Efetivação da baixa real do ativo (se vinculado e solicitado)
        if data.write_off_asset and evaluation.asset_id:
            asset = (
                db_session.query(AssetModel)
                .filter(AssetModel.id == evaluation.asset_id)
                .first()
            )
            if asset:
                setattr(asset, "active", False)
                disposal_status = (
                    db_session.query(AssetStatusModel)
                    .filter(AssetStatusModel.id == AssetStatusEnum.DESCARTE.value)
                    .first()
                )
                if disposal_status:
                    asset.status = disposal_status
                    setattr(asset, "status_id", disposal_status.id)
                db_session.add(asset)

        db_session.commit()
        db_session.refresh(evaluation)
        return self._serialize_evaluation(evaluation)
