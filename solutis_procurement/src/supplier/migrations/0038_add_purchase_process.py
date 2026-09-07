import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("supplier", "0037_update_compliance_evaluation_department"),
    ]

    operations = [
        migrations.CreateModel(
            name="PurchaseProcess",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("schema_version", models.IntegerField(default=1)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("Pendente", "Pendente"),
                            ("Em análise", "Em análise"),
                            ("Aprovado", "Aprovado"),
                            ("Reprovado", "Reprovado"),
                            ("Dispensado", "Dispensado"),
                        ],
                        db_index=True,
                        default="Pendente",
                        max_length=50,
                    ),
                ),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("Normal", "Normal"),
                            ("Urgência", "Urgência"),
                            ("Prioridade", "Prioridade"),
                        ],
                        db_index=True,
                        default="Normal",
                        max_length=50,
                    ),
                ),
                (
                    "object_description",
                    models.CharField(
                        blank=True, db_index=True, default="", max_length=500
                    ),
                ),
                (
                    "responsible_buyer",
                    models.CharField(
                        blank=True, db_index=True, default="", max_length=255
                    ),
                ),
                (
                    "requester",
                    models.CharField(
                        blank=True, db_index=True, default="", max_length=255
                    ),
                ),
                (
                    "process_date",
                    models.DateField(blank=True, db_index=True, null=True),
                ),
                (
                    "identification",
                    models.JSONField(
                        default=dict, help_text="Header identification fields"
                    ),
                ),
                (
                    "suppliers",
                    models.JSONField(
                        default=list,
                        help_text="List of quoted suppliers with financial conditions",
                    ),
                ),
                (
                    "items",
                    models.JSONField(
                        default=list,
                        help_text="Detailed items with quantity and unit prices per supplier",
                    ),
                ),
                (
                    "decision",
                    models.JSONField(
                        default=dict,
                        help_text="Decision recommendation, exception justification, etc.",
                    ),
                ),
                (
                    "approval",
                    models.JSONField(
                        default=dict,
                        help_text="Approval status, approver, date and comments",
                    ),
                ),
                (
                    "evaluation",
                    models.JSONField(
                        default=dict,
                        help_text="Supplier post-purchase 6-criteria satisfaction evaluation",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True, db_index=True)),
            ],
            options={
                "verbose_name": "Processo de Compra",
                "verbose_name_plural": "Processos de Compra",
                "db_table": "purchase_process",
                "ordering": ["-updated_at"],
            },
        ),
    ]
