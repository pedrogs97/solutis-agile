from django.db import migrations


def update_compliance_evaluation_department(apps, schema_editor):
    ApprovalStep = apps.get_model("supplier", "ApprovalStep")
    ApprovalStep.objects.filter(name__icontains="Compliance").update(
        department="Compliance e Sustentabilidade"
    )


def reverse_update(apps, schema_editor):
    ApprovalStep = apps.get_model("supplier", "ApprovalStep")
    ApprovalStep.objects.filter(name__icontains="Compliance").update(
        department="Financeiro"
    )


class Migration(migrations.Migration):

    dependencies = [
        ("supplier", "0036_update_manager_evaluation_department"),
    ]

    operations = [
        migrations.RunPython(update_compliance_evaluation_department, reverse_update),
    ]
