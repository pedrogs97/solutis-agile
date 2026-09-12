from datetime import datetime, timedelta, timezone
from sqlmodel import Session, select
from loguru import logger

from src.models.area import Area
from src.models.cost_center import CostCenter
from src.models.project import Project
from src.models.demand import Demand, DemandType, DemandPriority, DemandStatus, ApprovalStatus
from src.models.acl import UserRoleMapping, FlowRole


def seed_database(db: Session) -> None:
    """Idempotently seed the flow_db database with core operational data if empty."""
    try:
        # 1. Areas
        existing_areas = db.exec(select(Area)).all()
        areas_by_name = {a.name: a for a in existing_areas}
        if not existing_areas:
            logger.info("Seeding initial corporate areas...")
            initial_areas = [
                Area(name="Administrativo", description="Rotinas de governança e apoio institucional"),
                Area(name="Financeiro", description="Controle de contas, reembolsos e pagamentos"),
                Area(name="Operações", description="Logística, suprimentos e infraestrutura"),
                Area(name="Compras", description="Cotações de fornecedores e compras corporativas"),
                Area(name="Jurídico", description="Contratos, aprovações de minutas e conformidade"),
                Area(name="ESG", description="Sustentabilidade, emissão e governança social"),
                Area(name="Diretoria", description="Gestão estratégica e aprovações corporativas"),
            ]
            for area in initial_areas:
                db.add(area)
            db.commit()
            existing_areas = db.exec(select(Area)).all()
            areas_by_name = {a.name: a for a in existing_areas}

        # 2. Cost Centers
        existing_ccs = db.exec(select(CostCenter)).all()
        ccs_by_code = {c.code: c for c in existing_ccs}
        if not existing_ccs:
            logger.info("Seeding initial cost centers...")
            initial_ccs = [
                CostCenter(code="CC-101", name="Administrativo Geral"),
                CostCenter(code="CC-102", name="Operações e Logística"),
                CostCenter(code="CC-103", name="Finanças e Auditoria"),
                CostCenter(code="CC-104", name="ESG e Meio Ambiente"),
                CostCenter(code="CC-201", name="Diretoria Executiva"),
            ]
            for cc in initial_ccs:
                db.add(cc)
            db.commit()
            existing_ccs = db.exec(select(CostCenter)).all()
            ccs_by_code = {c.code: c for c in existing_ccs}

        # 3. Projects
        existing_projects = db.exec(select(Project)).all()
        if not existing_projects:
            logger.info("Seeding initial projects...")
            ops_area = areas_by_name.get("Operações") or existing_areas[0]
            fin_area = areas_by_name.get("Financeiro") or existing_areas[0]
            esg_area = areas_by_name.get("ESG") or existing_areas[0]

            initial_projects = [
                Project(
                    name="Modernização de Coletores CD-Oeste",
                    description="Substituição e automação da frota de coletores de código de barras nas docas de recebimento.",
                    status="EM_ANDAMENTO",
                    due_date=datetime.now(timezone.utc) + timedelta(days=20),
                    area_id=ops_area.id,
                    creator_user_id=2,
                ),
                Project(
                    name="Auditoria de Reembolsos e Compliance 2026",
                    description="Mapeamento e auditoria preventiva em todas as solicitações de deslocamento e alimentação.",
                    status="EM_ANDAMENTO",
                    due_date=datetime.now(timezone.utc) + timedelta(days=35),
                    area_id=fin_area.id,
                    creator_user_id=2,
                ),
                Project(
                    name="Governança ESG e GHG Protocol",
                    description="Implementação de indicadores de sustentabilidade corporativa e conformidade ESG para relatórios anuais.",
                    status="EM_ANDAMENTO",
                    due_date=datetime.now(timezone.utc) + timedelta(days=50),
                    area_id=esg_area.id,
                    creator_user_id=1,
                ),
            ]
            for p in initial_projects:
                db.add(p)
            db.commit()
            existing_projects = db.exec(select(Project)).all()

        # 4. Demands
        existing_demands = db.exec(select(Demand)).all()
        if not existing_demands:
            logger.info("Seeding initial corporate demands...")
            ops_area = areas_by_name.get("Operações") or existing_areas[0]
            fin_area = areas_by_name.get("Financeiro") or existing_areas[0]
            compras_area = areas_by_name.get("Compras") or existing_areas[0]
            jur_area = areas_by_name.get("Jurídico") or existing_areas[0]
            esg_area = areas_by_name.get("ESG") or existing_areas[0]
            dir_area = areas_by_name.get("Diretoria") or existing_areas[0]

            cc_101 = ccs_by_code.get("CC-101") or existing_ccs[0]
            cc_102 = ccs_by_code.get("CC-102") or existing_ccs[0]
            cc_103 = ccs_by_code.get("CC-103") or existing_ccs[0]
            cc_104 = ccs_by_code.get("CC-104") or existing_ccs[0]
            cc_201 = ccs_by_code.get("CC-201") or existing_ccs[0]

            prj_1 = existing_projects[0] if existing_projects else None
            prj_2 = existing_projects[1] if len(existing_projects) > 1 else None

            initial_demands = [
                Demand(
                    type=DemandType.COMPRAS,
                    title="Compra de 5 Coletores de Dados Industriais",
                    description="Necessitamos de 5 novos coletores de dados rugged Zebra TC21 para reposição do Centro de Distribuição do Centro-Oeste.",
                    solicitor_user_id=4,
                    assignee_user_id=3,
                    manager_user_id=2,
                    priority=DemandPriority.ALTA,
                    status=DemandStatus.EM_ANDAMENTO,
                    approval_status=ApprovalStatus.NENHUMA,
                    sla_limit_hours=48,
                    sla_spent_hours=12,
                    due_date=datetime.now(timezone.utc) + timedelta(days=2),
                    time_estimated_hours=8.0,
                    time_spent_hours=2.0,
                    area_id=ops_area.id,
                    cost_center_id=cc_102.id,
                    project_id=prj_1.id if prj_1 else None,
                ),
                Demand(
                    type=DemandType.REEMBOLSO,
                    title="Reembolso Viagem de Auditoria em Campo - MG",
                    description="Solicitação de reembolso de despesas de hotel, alimentação e combustível referentes à auditoria realizada.",
                    solicitor_user_id=3,
                    assignee_user_id=3,
                    manager_user_id=2,
                    priority=DemandPriority.MEDIA,
                    status=DemandStatus.EM_ANDAMENTO,
                    approval_status=ApprovalStatus.AGUARDANDO_APROVACAO,
                    sla_limit_hours=72,
                    sla_spent_hours=68,  # Close to SLA warning limit
                    due_date=datetime.now(timezone.utc) + timedelta(hours=4),
                    time_estimated_hours=6.0,
                    time_spent_hours=4.0,
                    area_id=fin_area.id,
                    cost_center_id=cc_103.id,
                    project_id=prj_2.id if prj_2 else None,
                ),
                Demand(
                    type=DemandType.ESG,
                    title="Relatório Mensal de Pegada de Carbono - Maio 2026",
                    description="Consolidação das emissões de frete terceirizado e consumo de energia em conformidade com o GHG Protocol.",
                    solicitor_user_id=4,
                    assignee_user_id=3,
                    manager_user_id=2,
                    priority=DemandPriority.MEDIA,
                    status=DemandStatus.PENDENTE,
                    approval_status=ApprovalStatus.NENHUMA,
                    sla_limit_hours=120,
                    sla_spent_hours=5,
                    due_date=datetime.now(timezone.utc) + timedelta(days=5),
                    time_estimated_hours=16.0,
                    time_spent_hours=0.0,
                    area_id=esg_area.id,
                    cost_center_id=cc_104.id,
                ),
                Demand(
                    type=DemandType.CONTRATOS,
                    title="Revisão Contrato de Outsourcing de Suporte de TI",
                    description="Análise de cláusula de retenção, SLAs e penalidades contratuais da nova provedora de Service Desk.",
                    solicitor_user_id=4,
                    assignee_user_id=None,
                    manager_user_id=2,
                    priority=DemandPriority.ALTA,
                    status=DemandStatus.PENDENTE,
                    approval_status=ApprovalStatus.NENHUMA,
                    sla_limit_hours=24,
                    sla_spent_hours=28,  # Overdue SLA
                    due_date=datetime.now(timezone.utc) - timedelta(hours=4),
                    time_estimated_hours=4.0,
                    time_spent_hours=0.0,
                    area_id=jur_area.id,
                    cost_center_id=cc_101.id,
                ),
                Demand(
                    type=DemandType.REEMBOLSO,
                    title="Fechamento Mensal de Notas Fiscais e Conciliação",
                    description="Conferência e baixa patrimonial das notas fiscais emitidas no último ciclo fiscal.",
                    solicitor_user_id=3,
                    assignee_user_id=3,
                    manager_user_id=2,
                    priority=DemandPriority.MEDIA,
                    status=DemandStatus.CONCLUIDO,
                    approval_status=ApprovalStatus.APROVADO,
                    sla_limit_hours=48,
                    sla_spent_hours=24,
                    due_date=datetime.now(timezone.utc) - timedelta(days=2),
                    time_estimated_hours=10.0,
                    time_spent_hours=9.0,
                    evidence_description="Conciliação bancária 100% finalizada e comprovantes anexados ao processo.",
                    area_id=fin_area.id,
                    cost_center_id=cc_103.id,
                ),
                Demand(
                    type=DemandType.COMPRAS,
                    title="Aprovação do Plano Estratégico de TI e Aquisições",
                    description="Aquisição corporativa e homologação do parque tecnológico e contratos anuais de suporte.",
                    solicitor_user_id=2,
                    assignee_user_id=2,
                    manager_user_id=1,
                    priority=DemandPriority.ALTA,
                    status=DemandStatus.CONCLUIDO,
                    approval_status=ApprovalStatus.APROVADO,
                    sla_limit_hours=72,
                    sla_spent_hours=30,
                    due_date=datetime.now(timezone.utc) - timedelta(days=5),
                    time_estimated_hours=14.0,
                    time_spent_hours=12.0,
                    evidence_description="Ata assinada e aprovada pela diretoria executiva.",
                    area_id=dir_area.id,
                    cost_center_id=cc_201.id,
                ),
            ]
            for d in initial_demands:
                db.add(d)
            db.commit()

        # 5. User ACL Mappings
        existing_roles = db.exec(select(UserRoleMapping)).all()
        if not existing_roles:
            logger.info("Seeding initial user role mappings...")
            initial_roles = [
                UserRoleMapping(user_id=1, role=FlowRole.ADMIN),
                UserRoleMapping(user_id=2, role=FlowRole.GESTOR),
                UserRoleMapping(user_id=3, role=FlowRole.ANALISTA),
                UserRoleMapping(user_id=4, role=FlowRole.SOLICITANTE),
                UserRoleMapping(user_id=5, role=FlowRole.APROVADOR),
            ]
            for r in initial_roles:
                db.add(r)
            db.commit()

        logger.info("Database seeding check completed successfully.")
    except Exception as e:
        logger.error(f"Error during database seeding: {e}")
        db.rollback()
