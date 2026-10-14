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
        parser.add_argument(
            "--from-csv-only",
            "--offline",
            dest="from_csv_only",
            action="store_true",
            default=False,
            help="Sync/seed suppliers directly from CSV without connecting to TOTVS",
        )

    def handle(self, *args, **options):
        """Execute the command"""
        csv_file = options.get("csv_file")
        from_csv_only = options.get("from_csv_only", False)
        self.stdout.write(self.style.WARNING("Starting supplier synchronization..."))
        if csv_file:
            self.stdout.write(self.style.NOTICE(f"Using CSV file: {csv_file}"))

        try:
            if from_csv_only:
                self.stdout.write(
                    self.style.NOTICE(
                        "Operating in direct CSV sync mode (offline/no TOTVS)"
                    )
                )
                sync_service = SupplierSyncService(csv_path=csv_file)
                count = sync_service.sync_from_csv_only()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Successfully seeded/synchronized {count} suppliers directly from CSV"
                    )
                )
                return

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
