"""
Management command to synchronize suppliers from TOTVS.
Usage: python manage.py sync_suppliers
"""

from django.core.management.base import BaseCommand
from src.sync.services import DatabaseConnectionService, SupplierSyncService


class Command(BaseCommand):
    """Django management command for syncing suppliers from TOTVS"""

    help = "Synchronize suppliers from TOTVS to local database using a CSV file"

    def add_arguments(self, parser):
        """Add command arguments"""
        parser.add_argument(
            "--csv-file",
            "--csv",
            dest="csv_file",
            type=str,
            default=None,
            help="Path to CSV file with suppliers (nome, cnpj, grau_de_risco)",
        )

    def handle(self, *args, **options):
        """Execute the command"""
        csv_file = options.get("csv_file")
        self.stdout.write(self.style.WARNING("Starting supplier synchronization..."))
        if csv_file:
            self.stdout.write(self.style.NOTICE(f"Using CSV file: {csv_file}"))

        try:
            # Initialize services
            db_service = DatabaseConnectionService()
            sync_service = SupplierSyncService(db_service, csv_path=csv_file)

            # Execute synchronization
            count = sync_service.sync_suppliers()

            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully synchronized {count} suppliers from TOTVS"
                )
            )

        except Exception as error:
            self.stdout.write(
                self.style.ERROR(f"Failed to synchronize suppliers: {error}")
            )
            raise
