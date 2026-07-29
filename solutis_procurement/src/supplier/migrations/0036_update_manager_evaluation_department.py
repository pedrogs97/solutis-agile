from django.db import migrations


def update_manager_evaluation_department(apps, schema_editor):
    ApprovalStep = apps.get_model("supplier", "ApprovalStep")
    ApprovalStep.objects.filter(name__icontains="Avaliação do Gestor").update(
        department="Gestor"
    )


def reverse_update(apps, schema_editor):
    ApprovalStep = apps.get_model("supplier", "ApprovalStep")
    ApprovalStep.objects.filter(name__icontains="Avaliação do Gestor").update(
        department="Administrativo"
    )


class Migration(migrations.Migration):

    dependencies = [
        ("supplier", "0035_cutover_evaluation_hybrid_period"),
    ]

    operations = [
        migrations.RunPython(update_manager_evaluation_department, reverse_update),
    ]
