"""Employee excel generator module"""

from io import BytesIO
from typing import Any, Dict, List

import openpyxl
from openpyxl.styles import Alignment, Font
from services.excel_generator import AbstractExcelGenerator

DATA_KEYS = [
    "employee",
    "code",
    "role",
    "project",
    "bu",
    "cost_center",
    "cost_center_code",
    "manager",
    "executive",
    "workload",
    "equipment_description",
    "patrimony",
    "equipment_standard",
    "status",
]


class EmployeeExcelGenerator(AbstractExcelGenerator):
    """Employee report excel generator."""

    def get_headers(self) -> List[str]:
        """Returns the headers for the Excel file."""
        return [
            "N°",
            "COLABORADOR",
            "CPF",
            "CARGO",
            "PROJETO",
            "BU",
            "CENTRO DE CUSTO",
            "CENTRO DE CUSTO (código)",
            "GESTOR",
            "EXECUTIVO",
            "LOCAL DE TRABALHO",
            "DESCRIÇÃO DO EQUIPAMENTO",
            "PATRIMÔNIO",
            "PADRÃO EQUIPAMENTO",
            "STATUS",
        ]

    def get_sheet_title(self) -> str:
        """Returns the Excel sheet title."""
        return "CONSULTA POR COLABORADOR"

    def generate(self, data: List[Dict[str, Any]]) -> BytesIO:
        """Generates an Excel file from the employee report data."""
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

        for row_idx, row_data in enumerate(data, start=1):
            row_values = [row_idx]
            for key in DATA_KEYS:
                row_values.append(row_data.get(key, ""))
            ws.append(row_values)

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
