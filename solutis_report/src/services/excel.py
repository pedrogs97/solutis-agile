"""Supplier evaluation excel generator module"""

from io import BytesIO
from typing import Any, Dict, List

import openpyxl
from openpyxl.styles import Alignment, Font
from services.excel_generator import AbstractExcelGenerator


def format_date_br(value: Any) -> str:
    """Format ISO date/date-like values as dd/mm/yyyy."""
    if not value:
        return ""

    value_str = str(value)
    if "/" in value_str:
        return value_str

    date_part = value_str.split("T", maxsplit=1)[0]
    parts = date_part.split("-")
    if len(parts) != 3:
        return value_str

    year, month, day = parts
    return f"{day}/{month}/{year}"


class SupplierEvaluationExcelGenerator(AbstractExcelGenerator):
    """Supplier evaluation excel generator."""

    def get_headers(self) -> List[str]:
        """Returns the headers for the Excel file."""
        return [
            "Nome",
            "CNPJ",
            "Pontuação",
            "Período",
            "Ano",
            "Avaliador",
            "Data da Avaliação",
        ]

    def get_sheet_title(self) -> str:
        """Returns the Excel sheet title."""
        return "Avaliações de Fornecedores"

    def generate(self, data: List[Dict[str, Any]]) -> BytesIO:
        """Generates an Excel file from the supplier evaluation data."""
        wb = openpyxl.Workbook()
        ws = wb.active
        if not ws:
            raise ValueError("Could not create worksheet")

        ws.title = self.get_sheet_title()

        headers = self.get_headers()

        ws.append(headers)

        for col in range(1, len(headers) + 1):
            cell = ws.cell(row=1, column=col)
            cell.font = Font(bold=True)
            cell.alignment = Alignment(horizontal="center")

        for row_data in data:
            ws.append(
                [
                    row_data.get("trade_name", ""),
                    row_data.get("tax_id", ""),
                    row_data.get("final_score", ""),
                    row_data.get("period", ""),
                    row_data.get("evaluation_year", ""),
                    row_data.get("evaluator_name", ""),
                    format_date_br(row_data.get("evaluation_date")),
                ]
            )

        for col in ws.columns:
            max_length = 0
            column = col[0].column_letter
            for cell in col:
                try:
                    max_length = max(max_length, len(str(cell.value)))
                except Exception:  # pylint: disable=broad-except
                    ...
            adjusted_width = max_length + 2
            ws.column_dimensions[column].width = adjusted_width

        output = BytesIO()
        wb.save(output)
        output.seek(0)
        return output
