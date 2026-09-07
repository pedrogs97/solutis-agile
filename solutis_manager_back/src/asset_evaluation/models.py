"""Asset Technical Evaluation Models (FO-PAT-02)"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.database import Base


class AssetCatalogComponentModel(Base):
    """Catálogo compartilhado de componentes para sugestão e autocompletar na matriz."""

    __tablename__ = "asset_catalog_component"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(
        String(200), unique=True, nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    def __str__(self) -> str:
        return str(self.name)


class AssetEvaluationComponentModel(Base):
    """Componentes avaliados na matriz dinâmica de reaproveitamento do FO-PAT-02."""

    __tablename__ = "asset_evaluation_component"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    evaluation_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("asset_technical_evaluation.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    condition: Mapped[str] = mapped_column(String(50), default="Boa", nullable=False)
    destination: Mapped[str] = mapped_column(
        String(100), default="Reaproveitamento interno", nullable=False
    )
    observations: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    evaluation: Mapped["AssetTechnicalEvaluationModel"] = relationship(
        back_populates="components"
    )

    def __str__(self) -> str:
        return f"{self.name} ({self.quantity}) - {self.condition} -> {self.destination}"


class AssetEvaluationAttachmentModel(Base):
    """Anexos e evidências reais da avaliação técnica de patrimônio."""

    __tablename__ = "asset_evaluation_attachment"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    evaluation_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("asset_technical_evaluation.id", ondelete="CASCADE"),
        nullable=False,
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    path: Mapped[str] = mapped_column(String(500), nullable=False)
    checklist_key: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    evaluation: Mapped["AssetTechnicalEvaluationModel"] = relationship(
        back_populates="attachments"
    )

    def __str__(self) -> str:
        return f"{self.file_name} ({self.path})"


class AssetTechnicalEvaluationModel(Base):
    """
    Formulário FO-PAT-02 — Avaliação Técnica, Reaproveitamento, Descarte e Baixa Patrimonial.
    Contempla matriz de componentes, controle de pesagem ESG, avaliação financeira e fluxo de aprovação.
    """

    __tablename__ = "asset_technical_evaluation"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    protocol: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    evaluation_date: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    asset_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("asset.id"), nullable=True
    )
    patrimonio: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    asset_type_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    brand_model: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    serial_number: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    cost_center: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    unity: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    status: Mapped[str] = mapped_column(String(50), default="Rascunho", nullable=False)
    classification: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    feasibility: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    destination_raw: Mapped[Optional[str]] = mapped_column(
        "destination", String(500), default="", nullable=True
    )

    gross_weight: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    reused_weight: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    discarded_weight: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    recycle_weight: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    reuse_percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    acquisition_value: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    net_book_value: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    estimated_economy: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    justification: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    technical_opinion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    evaluator_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    evaluator_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    approver_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    approver_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    approval_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    approval_comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        server_onupdate=func.now(),
    )

    asset = relationship("src.asset.models.AssetModel", back_populates="evaluations")
    components: Mapped[List[AssetEvaluationComponentModel]] = relationship(
        back_populates="evaluation", cascade="all, delete-orphan", lazy="selectin"
    )
    attachments: Mapped[List[AssetEvaluationAttachmentModel]] = relationship(
        back_populates="evaluation", cascade="all, delete-orphan", lazy="selectin"
    )

    def __str__(self) -> str:
        return f"{self.protocol} - {self.patrimonio} ({self.status})"
