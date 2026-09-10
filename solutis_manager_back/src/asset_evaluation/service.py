"""Service layer for FO-PAT-02 Asset Technical Evaluation"""

import os
import random
import uuid
from datetime import datetime
from typing import Any

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

    def get_catalog_components(self, db_session: Session) -> list[dict[str, Any]]:
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

    def add_catalog_component(self, db_session: Session, name: str) -> dict[str, Any]:
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

    def register_new_components(self, db_session: Session, names: list[str]) -> None:
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
            "id": int(evaluation.id),
            "protocol": str(evaluation.protocol),
            "evaluation_date": evaluation.evaluation_date,
            "asset_id": evaluation.asset_id,
            "patrimonio": evaluation.patrimonio,
            "asset_type_name": evaluation.asset_type_name,
            "brand_model": evaluation.brand_model,
            "manufacturer": getattr(evaluation, "manufacturer", None),
            "model": getattr(evaluation, "model", None),
            "serial_number": evaluation.serial_number,
            "cost_center": evaluation.cost_center,
            "unity": evaluation.unity,
            "current_location": getattr(evaluation, "current_location", None),
            "is_under_warranty": bool(getattr(evaluation, "is_under_warranty", False)),
            "warranty_expiry_date": getattr(evaluation, "warranty_expiry_date", None),
            "asset_description": getattr(evaluation, "asset_description", None),
            "status": str(evaluation.status),
            "classification": evaluation.classification,
            "feasibility": evaluation.feasibility,
            "destination": destinations,
            "gross_weight": float(evaluation.gross_weight or 0.0),
            "reused_weight": float(evaluation.reused_weight or 0.0),
            "discarded_weight": float(evaluation.discarded_weight or 0.0),
            "recycle_weight": float(evaluation.recycle_weight or 0.0),
            "reuse_percentage": float(evaluation.reuse_percentage or 0.0),
            "destination_company": getattr(evaluation, "destination_company", None),
            "destination_cnpj": getattr(evaluation, "destination_cnpj", None),
            "destination_certificate": getattr(
                evaluation, "destination_certificate", None
            ),
            "waste_manifest": getattr(evaluation, "waste_manifest", None),
            "acquisition_value": float(evaluation.acquisition_value or 0.0),
            "net_book_value": float(evaluation.net_book_value or 0.0),
            "usage_time": getattr(evaluation, "usage_time", None),
            "expected_lifespan": getattr(evaluation, "expected_lifespan", None),
            "estimated_economy": float(evaluation.estimated_economy or 0.0),
            "justification": evaluation.justification,
            "technical_opinion": evaluation.technical_opinion,
            "write_off_date": getattr(evaluation, "write_off_date", None),
            "write_off_reason": getattr(evaluation, "write_off_reason", None),
            "reused_parts_location": getattr(evaluation, "reused_parts_location", None),
            "waste_final_destination": getattr(
                evaluation, "waste_final_destination", None
            ),
            "write_off_notes": getattr(evaluation, "write_off_notes", None),
            "document_start_date": getattr(evaluation, "document_start_date", None),
            "document_end_date": getattr(evaluation, "document_end_date", None),
            "document_classification": getattr(
                evaluation, "document_classification", "USO INTERNO"
            )
            or "USO INTERNO",
            "elaborated_by_date": getattr(evaluation, "elaborated_by_date", None),
            "reviewed_by_date": getattr(evaluation, "reviewed_by_date", None),
            "approved_by_date": getattr(evaluation, "approved_by_date", None),
            "evaluator_id": evaluation.evaluator_id,
            "evaluator_name": evaluation.evaluator_name,
            "reviewer_name": getattr(evaluation, "reviewer_name", None),
            "approver_id": evaluation.approver_id,
            "approver_name": evaluation.approver_name,
            "approval_date": evaluation.approval_date,
            "approval_comments": evaluation.approval_comments,
            "created_at": evaluation.created_at,
            "updated_at": evaluation.updated_at,
            "components": [
                ComponentItemOutSchema(
                    id=int(c.id),
                    evaluation_id=int(c.evaluation_id),
                    name=str(c.name),
                    quantity=int(c.quantity),
                    condition=str(c.condition),
                    destination=str(c.destination),
                    observations=c.observations,
                )
                for c in (evaluation.components or [])
            ],
            "attachments": [
                AttachmentOutSchema(
                    id=int(a.id),
                    file_name=str(a.file_name),
                    path=str(a.path),
                    checklist_key=a.checklist_key,
                    created_at=a.created_at,
                )
                for a in (evaluation.attachments or [])
            ],
        }
        return AssetEvaluationOutSchema.model_validate(eval_dict)

    def create_evaluation(
        self,
        db_session: Session,
        data: AssetEvaluationCreateSchema,
        authenticated_user: UserModel | None = None,
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
                if not data.manufacturer and getattr(asset, "brand", None):
                    data.manufacturer = str(asset.brand)
                if not data.model and getattr(asset, "model", None):
                    data.model = str(asset.model)
                if not data.brand_model:
                    brand = str(getattr(asset, "brand", "") or "")
                    model = str(getattr(asset, "model", "") or "")
                    full = f"{brand} {model}".strip()
                    data.brand_model = full or None
                if (
                    not data.acquisition_value
                    and getattr(asset, "value", None) is not None
                ):
                    data.acquisition_value = float(asset.value or 0.0)
                if not data.asset_type_name and getattr(asset, "type", None):
                    data.asset_type_name = str(asset.type.name)

        if not data.brand_model and (data.manufacturer or data.model):
            data.brand_model = (
                f"{data.manufacturer or ''} {data.model or ''}".strip() or None
            )

        destination_str = "|".join([d.strip() for d in data.destination if d.strip()])

        evaluation_date = data.evaluation_date or datetime.now()
        evaluator_name = data.evaluator_name or (
            authenticated_user.username if authenticated_user else None
        )

        evaluation = AssetTechnicalEvaluationModel(
            protocol=protocol,
            evaluation_date=evaluation_date,
            document_start_date=data.document_start_date,
            document_end_date=data.document_end_date,
            document_classification=data.document_classification or "USO INTERNO",
            elaborated_by_date=data.elaborated_by_date,
            reviewed_by_date=data.reviewed_by_date,
            approved_by_date=data.approved_by_date,
            asset_id=data.asset_id,
            patrimonio=data.patrimonio,
            asset_type_name=data.asset_type_name,
            brand_model=data.brand_model,
            manufacturer=data.manufacturer,
            model=data.model,
            serial_number=data.serial_number,
            cost_center=data.cost_center,
            unity=data.unity,
            current_location=data.current_location,
            is_under_warranty=bool(data.is_under_warranty),
            warranty_expiry_date=data.warranty_expiry_date,
            asset_description=data.asset_description,
            status=data.status or "Rascunho",
            classification=data.classification,
            feasibility=data.feasibility,
            destination_raw=destination_str,
            gross_weight=data.gross_weight,
            reused_weight=data.reused_weight,
            discarded_weight=data.discarded_weight,
            recycle_weight=data.recycle_weight,
            reuse_percentage=data.reuse_percentage,
            destination_company=data.destination_company,
            destination_cnpj=data.destination_cnpj,
            destination_certificate=data.destination_certificate,
            waste_manifest=data.waste_manifest,
            acquisition_value=data.acquisition_value,
            net_book_value=data.net_book_value,
            usage_time=data.usage_time,
            expected_lifespan=data.expected_lifespan,
            estimated_economy=data.estimated_economy,
            justification=data.justification or data.technical_opinion,
            technical_opinion=data.technical_opinion or data.justification,
            write_off_date=data.write_off_date,
            write_off_reason=data.write_off_reason,
            reused_parts_location=data.reused_parts_location,
            waste_final_destination=data.waste_final_destination,
            write_off_notes=data.write_off_notes,
            evaluator_id=authenticated_user.id if authenticated_user else None,
            evaluator_name=evaluator_name,
            reviewer_name=data.reviewer_name,
            approver_name=data.approver_name,
            approval_date=data.approval_date,
            approval_comments=data.approval_comments,
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
        authenticated_user: UserModel | None = None,
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

        if "technical_opinion" in update_dict and "justification" not in update_dict:
            if (
                not evaluation.justification
                or evaluation.justification == evaluation.technical_opinion
            ):
                update_dict["justification"] = update_dict["technical_opinion"]
        elif "justification" in update_dict and "technical_opinion" not in update_dict:
            if not evaluation.technical_opinion:
                update_dict["technical_opinion"] = update_dict["justification"]

        for field, value in update_dict.items():
            if hasattr(evaluation, field):
                setattr(evaluation, field, value)

        if (
            evaluation.manufacturer or evaluation.model
        ) and "brand_model" not in update_dict:
            evaluation.brand_model = (
                f"{evaluation.manufacturer or ''} {evaluation.model or ''}".strip()
                or None
            )

        db_session.commit()
        db_session.refresh(evaluation)
        return self._serialize_evaluation(evaluation)

    def list_evaluations(
        self,
        db_session: Session,
        page: int = 1,
        size: int = 20,
        status_filter: str | None = None,
        search: str | None = None,
        date_start: datetime | None = None,
        date_end: datetime | None = None,
    ) -> dict[str, Any]:
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
                func.sum(AssetTechnicalEvaluationModel.reused_weight),
                func.sum(AssetTechnicalEvaluationModel.discarded_weight),
                func.sum(AssetTechnicalEvaluationModel.recycle_weight),
                func.sum(AssetTechnicalEvaluationModel.estimated_economy),
                func.avg(AssetTechnicalEvaluationModel.reuse_percentage),
            )
            .filter(
                AssetTechnicalEvaluationModel.status.in_(
                    ["Aprovado", "Baixado", "Em avaliação"]
                )
            )
            .first()
        )

        reused_weight = (
            float(sums[0]) if sums and len(sums) > 0 and sums[0] is not None else 0.0
        )
        discarded_weight = (
            float(sums[1]) if sums and len(sums) > 1 and sums[1] is not None else 0.0
        )
        recycle_weight = (
            float(sums[2]) if sums and len(sums) > 2 and sums[2] is not None else 0.0
        )
        estimated_economy = (
            float(sums[3]) if sums and len(sums) > 3 and sums[3] is not None else 0.0
        )
        avg_reuse_pct = (
            round(float(sums[4]), 2)
            if sums and len(sums) > 4 and sums[4] is not None
            else 0.0
        )

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
        checklist_key: str | None = None,
    ) -> dict[str, Any]:
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
        authenticated_user: UserModel | None = None,
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
        if not evaluation.approved_by_date:
            evaluation.approved_by_date = evaluation.approval_date
        evaluation.approval_comments = data.comments
        if data.write_off_asset:
            if not evaluation.write_off_date:
                evaluation.write_off_date = evaluation.approval_date
            if not evaluation.write_off_notes and data.comments:
                evaluation.write_off_notes = data.comments

        # Efetivação da baixa real do ativo (se vinculado e solicitado)
        if data.write_off_asset and evaluation.asset_id:
            asset = (
                db_session.query(AssetModel)
                .filter(AssetModel.id == evaluation.asset_id)
                .first()
            )
            if asset:
                asset.active = False
                disposal_status = (
                    db_session.query(AssetStatusModel)
                    .filter(AssetStatusModel.id == AssetStatusEnum.DESCARTE.value)
                    .first()
                )
                if disposal_status:
                    asset.status = disposal_status
                    asset.status_id = disposal_status.id
                db_session.add(asset)

        db_session.commit()
        db_session.refresh(evaluation)
        return self._serialize_evaluation(evaluation)
