"""
Purchase Process Model (FO-AD-01) - Solutis Agile Procurement
"""

# pylint: disable=unsupported-membership-test,not-an-iterable,unnecessary-lambda

import uuid
from typing import Any, Dict, List, Optional

from django.db import models


class PurchaseProcess(models.Model):
    """
    Model representing a Purchase Analysis and Decision Process (FO-AD-01).
    Stores quotation matrix, items, comparative map, decision/approval, and supplier post-purchase evaluation.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    schema_version = models.IntegerField(default=1)

    # Search & Filter Indexed Columns
    status = models.CharField(
        max_length=50,
        default="Pendente",
        db_index=True,
        choices=[
            ("Pendente", "Pendente"),
            ("Em análise", "Em análise"),
            ("Aprovado", "Aprovado"),
            ("Reprovado", "Reprovado"),
            ("Dispensado", "Dispensado"),
        ],
    )
    category = models.CharField(
        max_length=50,
        default="Normal",
        db_index=True,
        choices=[
            ("Normal", "Normal"),
            ("Urgência", "Urgência"),
            ("Prioridade", "Prioridade"),
        ],
    )
    object_description = models.CharField(
        max_length=500, blank=True, default="", db_index=True
    )
    responsible_buyer = models.CharField(
        max_length=255, blank=True, default="", db_index=True
    )
    requester = models.CharField(max_length=255, blank=True, default="", db_index=True)
    process_date = models.DateField(null=True, blank=True, db_index=True)

    # Structured Document Payloads
    identification = models.JSONField(
        default=dict, help_text="Header identification fields"
    )
    suppliers = models.JSONField(
        default=list, help_text="List of quoted suppliers with financial conditions"
    )
    items = models.JSONField(
        default=list,
        help_text="Detailed items with quantity and unit prices per supplier",
    )
    decision = models.JSONField(
        default=dict, help_text="Decision recommendation, exception justification, etc."
    )
    approval = models.JSONField(
        default=dict, help_text="Approval status, approver, date and comments"
    )
    evaluation = models.JSONField(
        default=dict,
        help_text="Supplier post-purchase 6-criteria satisfaction evaluation",
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        db_table = "purchase_process"
        ordering = ["-updated_at"]
        verbose_name = "Processo de Compra"
        verbose_name_plural = "Processos de Compra"

    def __str__(self) -> str:
        return f"FO-AD-01 [{self.category}] {self.object_description or 'Sem Objeto'} ({self.status})"

    def sync_indexed_fields(self) -> None:
        """Sync indexed query fields from identification and approval JSON blobs."""
        ident = self.identification or {}
        apr = self.approval or {}

        if "objeto" in ident:
            self.object_description = str(ident.get("objeto") or "")[:500]
        if "categoria" in ident:
            self.category = str(ident.get("categoria") or "Normal")
        if "compradorResponsavel" in ident:
            self.responsible_buyer = str(ident.get("compradorResponsavel") or "")[:255]
        if "solicitante" in ident:
            self.requester = str(ident.get("solicitante") or "")[:255]
        if "data" in ident and ident.get("data"):
            try:
                self.process_date = str(ident.get("data"))[:10]
            except Exception:
                pass
        if "status" in apr and apr.get("status"):
            self.status = str(apr.get("status"))

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.sync_indexed_fields()
        super().save(*args, **kwargs)

    # --- Domain Calculations ---

    def has_items(self) -> bool:
        """Check if any item has a non-empty description."""
        for item in self.items or []:
            if str(item.get("descricao") or "").strip():
                return True
        return False

    def get_item_total(self, item: Dict[str, Any], supplier_id: str) -> float:
        """Calculate total value for a single item for a given supplier."""
        prices = item.get("precos") or {}
        price = prices.get(supplier_id) or 0
        try:
            p_val = float(price) if price is not None else 0.0
            q_val = float(item.get("qtd") or 1)
            return round(p_val * q_val, 2)
        except (ValueError, TypeError):
            return 0.0

    def get_auto_gross_value(self, supplier_id: str) -> float:
        """Calculate sum of item totals for a supplier."""
        total = 0.0
        for item in self.items or []:
            total += self.get_item_total(item, supplier_id)
        return round(total, 2)

    def get_gross_value(self, supplier: Dict[str, Any]) -> float:
        """Get gross value from items breakdown or manual fallback."""
        if self.has_items():
            return self.get_auto_gross_value(str(supplier.get("id")))
        val = supplier.get("valorBrutoManual")
        try:
            return round(float(val), 2) if val is not None else 0.0
        except (ValueError, TypeError):
            return 0.0

    def calculate_cta(self, supplier: Dict[str, Any]) -> float:
        """Calculate Total Cost of Acquisition (CTA) = Gross - Discount + Taxes + Freight + Other."""
        gross = self.get_gross_value(supplier)
        discount = float(supplier.get("desconto") or 0.0)
        taxes = float(supplier.get("impostos") or 0.0)
        freight = float(supplier.get("frete") or 0.0)
        other = float(supplier.get("outros") or 0.0)
        cta = gross - discount + taxes + freight + other
        return round(cta, 2)

    def get_filled_suppliers(self) -> List[Dict[str, Any]]:
        """Return suppliers with a non-empty name."""
        return [f for f in (self.suppliers or []) if str(f.get("nome") or "").strip()]

    def get_lowest_cta_supplier(self) -> Optional[Dict[str, Any]]:
        """Find the supplier with the lowest CTA."""
        filled = self.get_filled_suppliers()
        if not filled:
            return None
        return min(filled, key=lambda f: self.calculate_cta(f))

    def get_highest_cta_supplier(self) -> Optional[Dict[str, Any]]:
        """Find the supplier with the highest CTA."""
        filled = self.get_filled_suppliers()
        if not filled:
            return None
        return max(filled, key=lambda f: self.calculate_cta(f))

    def get_selected_supplier(self) -> Optional[Dict[str, Any]]:
        """Get the recommended supplier or fallback to lowest CTA."""
        dec = self.decision or {}
        rec_id = str(dec.get("fornecedorRecomendadoId") or "")
        for f in self.suppliers or []:
            if str(f.get("id")) == rec_id:
                return f
        return self.get_lowest_cta_supplier()

    def get_process_value(self) -> float:
        """Get the primary process monetary value based on selected supplier's CTA."""
        selected = self.get_selected_supplier()
        return self.calculate_cta(selected) if selected else 0.0

    def get_estimated_savings(self) -> float:
        """Difference between highest CTA and lowest CTA quoted."""
        low = self.get_lowest_cta_supplier()
        high = self.get_highest_cta_supplier()
        if low and high and str(low.get("id")) != str(high.get("id")):
            diff = self.calculate_cta(high) - self.calculate_cta(low)
            return round(max(0.0, diff), 2)
        return 0.0

    def get_evaluation_index(self) -> Optional[float]:
        """Compute average satisfaction score (0.0 to 1.0) over the 6 criteria."""
        eval_data = self.evaluation or {}
        if not eval_data.get("preenchida"):
            return None
        criteria = eval_data.get("criterios") or {}
        weights = {
            "Muito Satisfeito": 1.0,
            "Satisfeito": 0.9,
            "Regularmente Satisfeito": 0.6,
            "Insatisfatório": 0.3,
        }
        scores = []
        for crit_key in [
            "qualidade",
            "prazo",
            "pagamento",
            "custo",
            "atendimento",
            "logistica",
        ]:
            crit_item = criteria.get(crit_key) or {}
            nivel = crit_item.get("nivel")
            if nivel in weights:
                scores.append(weights[nivel])

        if not scores:
            return None
        # Average over the 6 criteria (unanswered count as 0 in denominator)
        return round(sum(scores) / 6.0, 4)

    def get_performance_classification(self) -> Optional[str]:
        """Classify supplier performance into Excelente, Satisfatório, Atenção, Insatisfatório."""
        idx = self.get_evaluation_index()
        if idx is None:
            return None
        if idx >= 0.9:
            return "Excelente"
        if idx >= 0.8:
            return "Satisfatório"
        if idx >= 0.6:
            return "Atenção"
        return "Insatisfatório"
