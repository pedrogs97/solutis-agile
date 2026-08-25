from typing import Optional
from sqlmodel import Field, SQLModel


class StandardProcedure(SQLModel, table=True):
    __tablename__ = "flow_standard_procedures"

    id: Optional[int] = Field(default=None, primary_key=True)
    demand_type: str = Field(index=True, unique=True)  # COMPRAS, REEMBOLSO, etc.
    flow_steps_json: str = "[]"  # JSON list of strings (e.g. ['Solicitado', 'Cotação', 'Finalizado'])
    procedure_document: str = ""  # Detailed Markdown
    video_url: str = ""
