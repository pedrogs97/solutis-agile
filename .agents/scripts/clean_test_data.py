#!/usr/bin/env python3
"""
Script utilitário para expurgo e sanitização de dados de teste (18/09/2026).
Remove registros mockados inseridos durante validação dos formulários:
- FO-PAT-02 (Avaliação Técnica e Descarte de Ativos)
- FO-AD-01 (Processo de Compras)
E restaura o status e atividade de ativos patrimoniais indevidamente baixados durante os testes.

Uso:
  python3 clean_test_data.py --dry-run
  python3 clean_test_data.py --execute --date 2026-09-18
"""

import argparse
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Raiz do monorepo
REPO_ROOT = Path(__file__).resolve().parent.parent.parent

# Adicionar caminhos dos microsserviços ao sys.path
sys.path.insert(0, str(REPO_ROOT / "solutis_manager_back"))
sys.path.insert(0, str(REPO_ROOT / "solutis_procurement"))


def clean_manager_evaluations(target_date_str: str, execute: bool = False):
    """Localiza e expurga avaliações técnicas e restaura ativos no solutis_manager_back."""
    print("\n" + "=" * 60)
    print(f"🔍 [solutis_manager_back] Verificando avaliações criadas em {target_date_str}...")
    print("=" * 60)

    try:
        from sqlalchemy import create_engine, select
        from sqlalchemy.orm import sessionmaker
        from src.asset.enums import AssetStatusEnum
        from src.asset.models import AssetModel, AssetStatusModel
        from src.asset_evaluation.models import (
            AssetEvaluationAttachmentModel,
            AssetEvaluationComponentModel,
            AssetTechnicalEvaluationModel,
        )
        from src.config import DATABASE_URL
    except ImportError as e:
        print(f"⚠️ Não foi possível importar módulos do solutis_manager_back: {e}")
        return

    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Buscar avaliações criadas ou avaliadas na data alvo
        evaluations = session.execute(
            select(AssetTechnicalEvaluationModel)
        ).scalars().all()

        target_evals = []
        for ev in evaluations:
            # Checar created_at, evaluation_date ou data no protocolo FO-PAT-02-YYYYMMDD-...
            eval_date = ev.evaluation_date.strftime("%Y-%m-%d") if ev.evaluation_date else ""
            created_date = ev.created_at.strftime("%Y-%m-%d") if ev.created_at else ""
            proto_date = ev.protocol.split("-")[2] if ev.protocol and len(ev.protocol.split("-")) >= 3 else ""
            target_compact = target_date_str.replace("-", "")

            if (
                eval_date == target_date_str
                or created_date == target_date_str
                or proto_date == target_compact
            ):
                target_evals.append(ev)

        print(f"📋 Avaliações identificadas para a data {target_date_str}: {len(target_evals)}")
        assets_to_restore = []

        for ev in target_evals:
            print(f"  - ID: {ev.id} | Protocolo: {ev.protocol} | Status: {ev.status} | Ativo ID: {ev.asset_id} | Tombo: {ev.patrimonio}")
            if ev.asset_id:
                asset = session.get(AssetModel, ev.asset_id)
                if asset:
                    assets_to_restore.append(asset)

        if not target_evals:
            print("✅ Nenhuma avaliação de teste encontrada nesta data.")
            return

        if execute:
            print("\n⚙️ Executando remoção e restauração...")
            # Status Disponível (normalmente ID 1)
            disponivel_status = session.execute(
                select(AssetStatusModel).where(AssetStatusModel.name == AssetStatusEnum.DISPONIVEL.name)
            ).scalar_one_or_none()

            for asset in assets_to_restore:
                print(f"  🔄 Restaurando ativo ID {asset.id} (Tombo: {asset.patrimonio})...")
                if disponivel_status:
                    asset.status_id = disponivel_status.id
                asset.active = True

            for ev in target_evals:
                print(f"  🗑️ Removendo avaliação ID {ev.id} ({ev.protocol})...")
                session.delete(ev)

            session.commit()
            print("✅ Expurgo do solutis_manager_back concluído com sucesso!")
        else:
            print("\n[DRY-RUN] Nenhuma alteração persistida. Use --execute para efetivar.")

    except Exception as e:
        session.rollback()
        print(f"❌ Erro ao processar solutis_manager_back: {e}")
    finally:
        session.close()


def clean_procurement_processes(target_date_str: str, execute: bool = False):
    """Localiza e expurga processos de compras no solutis_procurement."""
    print("\n" + "=" * 60)
    print(f"🔍 [solutis_procurement] Verificando processos de compra criados em {target_date_str}...")
    print("=" * 60)

    try:
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "solutis_procurement.settings")
        import django

        django.setup()
        from src.supplier.models import PurchaseProcessModel
    except Exception as e:
        print(f"⚠️ Não foi possível carregar ambiente Django do solutis_procurement: {e}")
        return

    try:
        qs = PurchaseProcessModel.objects.all()
        target_procs = []
        for p in qs:
            created_str = p.created_at.strftime("%Y-%m-%d") if p.created_at else ""
            if created_str == target_date_str:
                target_procs.append(p)

        print(f"📋 Processos de compras identificados para a data {target_date_str}: {len(target_procs)}")
        for p in target_procs:
            obj_desc = p.objeto or (p.payload.get("identificacao", {}).get("objeto", "Sem objeto") if p.payload else "")
            print(f"  - ID: {p.id} | Objeto: {obj_desc} | Categoria: {p.categoria} | Criado em: {p.created_at}")

        if not target_procs:
            print("✅ Nenhum processo de compras de teste encontrado nesta data.")
            return

        if execute:
            print("\n⚙️ Executando remoção dos processos de compras...")
            for p in target_procs:
                print(f"  🗑️ Removendo processo {p.id}...")
                p.delete()
            print("✅ Expurgo do solutis_procurement concluído com sucesso!")
        else:
            print("\n[DRY-RUN] Nenhuma alteração persistida. Use --execute para efetivar.")

    except Exception as e:
        print(f"❌ Erro ao processar solutis_procurement: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Higienização e expurgo de dados de teste (18/09/2026)."
    )
    parser.add_argument(
        "--date",
        default="2026-09-18",
        help="Data alvo dos testes no formato YYYY-MM-DD (padrão: 2026-09-18)",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Efetiva a remoção e restauração no banco de dados. Sem esta flag roda como dry-run.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Modo de simulação (padrão). Apenas exibe o que seria apagado.",
    )

    args = parser.parse_args()
    execute_mode = args.execute and not args.dry_run

    print(f"Iniciando rotina de limpeza de dados de teste...")
    print(f"Data Alvo: {args.date} | Modo: {'EXECUTE (ALTERAÇÕES NO BANCO)' if execute_mode else 'DRY-RUN (SIMULAÇÃO)'}")

    clean_manager_evaluations(args.date, execute=execute_mode)
    clean_procurement_processes(args.date, execute=execute_mode)


if __name__ == "__main__":
    main()
