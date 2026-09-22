"""Supplier schemas and mappers for Ninja v1."""

from typing import Any

from pydantic import AliasChoices, Field
from src.api.v1.schemas.common import CamelSchema, DomainRefOut
from src.api.v1.schemas.responsibility_matrix import serialize_responsibility_matrix
from src.supplier.models.supplier import Supplier
from src.utils.parse import to_camel_case


class TimestampedOut(CamelSchema):
    """Common timestamp fields returned by persisted nested supplier objects."""

    id: int
    created_at: str | None = None
    updated_at: str | None = None


class AddressOut(TimestampedOut):
    """Supplier address response."""

    postal_code: str | None = None
    number: int | None = None
    complement: str | None = None
    street: str | None = None
    city: str | None = None
    state: str | None = None
    neighbourhood: str | None = None


class ContactOut(TimestampedOut):
    """Supplier contact response."""

    name: str | None = None
    email: str | None = None
    phone: str | None = None


class ContractOut(TimestampedOut):
    """Supplier contract response."""

    object_contract: str | None = None
    executed_activities: str | None = None
    contract_start_date: str | None = None
    contract_end_date: str | None = None
    contract_type: str | None = None
    contract_period: str | None = None
    has_contract_renewal: bool | None = None
    warning_contract_renewal: bool | None = None
    warning_contract_period: str | None = None
    warning_on_termination: bool | None = None
    warning_on_renewal: bool | None = None
    warning_on_period: bool | None = None


class PaymentDetailsOut(TimestampedOut):
    """Supplier payment details response."""

    payment_frequency: str | None = None
    payment_date: str | None = None
    contract_total_value: float | None = None
    contract_monthly_value: float | None = None
    checking_account: str | None = None
    bank: str | None = None
    bank_code: str | None = None
    agency: str | None = None
    payment_method: int | None = None
    pix_key_type: int | None = None
    pix_key: str | None = None


class OrganizationalDetailsOut(TimestampedOut):
    """Supplier organizational details response."""

    cost_center: str | None = None
    business_unit: str | None = None
    responsible_executive: str | None = None
    responsible_manager: str | None = None
    payer_type: int | None = None
    business_sector: int | None = None
    taxpayer_classification: int | None = None
    public_entity: int | None = None


class FiscalDetailsOut(TimestampedOut):
    """Supplier fiscal details response."""

    iss_withholding: int | None = None
    iss_regime: int | None = None
    iss_taxpayer: bool | None = None
    simples_nacional_participant: bool | None = None
    cooperative_member: bool | None = None
    withholding_tax_nature: int | None = None


class CompanyInformationOut(TimestampedOut):
    """Supplier company information response."""

    company_size: int | None = None
    icms_taxpayer: int | None = None
    taxation_regime: int | None = None
    income_type: int | None = None
    taxation_method: int | None = None
    customer_type: int | None = None
    nit: str | None = None


class SupplierSituationOut(CamelSchema):
    """Current supplier situation response."""

    id: int
    supplier: int
    status: DomainRefOut | None = None
    created_at: str | None = None
    updated_at: str | None = None


class SupplierOut(CamelSchema):
    """Supplier detail response."""

    id: int
    name: str | None = None
    trade_name: str | None = None
    legal_name: str
    tax_id: str
    state_business_registration: str | None = None
    municipal_business_registration: str | None = None
    address: AddressOut | None = None
    contact: ContactOut | None = None
    payment_details: PaymentDetailsOut | None = None
    organizational_details: OrganizationalDetailsOut | None = None
    fiscal_details: FiscalDetailsOut | None = None
    company_information: CompanyInformationOut | None = None
    contract: ContractOut | None = None
    classification: DomainRefOut | None = None
    category: DomainRefOut | None = None
    risk_level: DomainRefOut | None = None
    type: DomainRefOut | None = None
    created_at: str | None = None
    updated_at: str | None = None
    situation: SupplierSituationOut | None = None
    responsibility_matrix: dict[str, Any] | None = None


class SupplierStatusSummaryOut(CamelSchema):
    """Supplier status summary used in list responses."""

    name: str | None = None


class SupplierSituationSummaryOut(CamelSchema):
    """Supplier situation summary used in list responses."""

    status: SupplierStatusSummaryOut


class SupplierRiskLevelSummaryOut(CamelSchema):
    """Supplier risk level summary used in list responses."""

    name: str | None = None


class SupplierContractSummaryOut(CamelSchema):
    """Supplier contract dates used in list responses."""

    contract_start_date: str | None = None
    contract_end_date: str | None = None


class SupplierListItemOut(CamelSchema):
    """Supplier item returned by paginated list endpoint."""

    id: int
    legal_name: str
    tax_id: str
    situation: SupplierSituationSummaryOut
    risk_level: SupplierRiskLevelSummaryOut
    contract: SupplierContractSummaryOut


class PaginatedSupplierListOut(CamelSchema):
    """Paginated supplier list response."""

    count: int
    next: str | None = None
    previous: str | None = None
    results: list[SupplierListItemOut]


class AddressPayload(CamelSchema):
    """Address payload used in supplier create/update."""

    postal_code: str | None = None
    number: int | None = None
    complement: str | None = None
    street: str | None = None
    city: str | None = None
    state: str | None = None
    neighbourhood: str | None = None


class ContactPayload(CamelSchema):
    """Contact payload used in supplier create/update."""

    name: str | None = None
    email: str | None = None
    phone: str | None = None


class ContractPayload(CamelSchema):
    """Contract payload used in supplier create/update."""

    object_contract: str | None = None
    executed_activities: str | None = None
    contract_start_date: str | None = None
    contract_end_date: str | None = None
    contract_type: str | None = None
    contract_period: str | None = None
    has_contract_renewal: bool | None = None
    warning_contract_renewal: bool | None = None
    warning_contract_period: str | None = None
    warning_on_termination: bool | None = None
    warning_on_renewal: bool | None = None
    warning_on_period: bool | None = None


class PaymentDetailsPayload(CamelSchema):
    """Payment details payload used in supplier create/update."""

    payment_frequency: str | None = None
    payment_date: str | None = None
    contract_total_value: float | None = None
    contract_monthly_value: float | None = None
    checking_account: str | None = None
    bank: str | None = None
    bank_code: str | None = None
    agency: str | None = None
    payment_method_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "paymentMethod", "payment_method", "payment_method_id"
        ),
    )
    pix_key_type_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices("pixKeyType", "pix_key_type", "pix_key_type_id"),
    )
    pix_key: str | None = None


class OrganizationalDetailsPayload(CamelSchema):
    """Organizational details payload used in supplier create/update."""

    cost_center: str | None = None
    business_unit: str | None = None
    responsible_executive: str | None = None
    responsible_manager: str | None = None
    payer_type_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices("payerType", "payer_type", "payer_type_id"),
    )
    business_sector_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "businessSector", "business_sector", "business_sector_id"
        ),
    )
    taxpayer_classification_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "taxpayerClassification",
            "taxpayer_classification",
            "taxpayer_classification_id",
        ),
    )
    public_entity_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "publicEntity", "public_entity", "public_entity_id"
        ),
    )


class FiscalDetailsPayload(CamelSchema):
    """Fiscal details payload used in supplier create/update."""

    iss_withholding_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "issWithholding", "iss_withholding", "iss_withholding_id"
        ),
    )
    iss_regime_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices("issRegime", "iss_regime", "iss_regime_id"),
    )
    iss_taxpayer: bool | None = None
    simples_nacional_participant: bool | None = None
    cooperative_member: bool | None = None
    withholding_tax_nature_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "withholdingTaxNature",
            "withholding_tax_nature",
            "withholding_tax_nature_id",
        ),
    )


class CompanyInformationPayload(CamelSchema):
    """Company information payload used in supplier create/update."""

    company_size_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices("companySize", "company_size", "company_size_id"),
    )
    icms_taxpayer_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "icmsTaxpayer", "icms_taxpayer", "icms_taxpayer_id"
        ),
    )
    taxation_regime_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "taxationRegime", "taxation_regime", "taxation_regime_id"
        ),
    )
    income_type_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices("incomeType", "income_type", "income_type_id"),
    )
    taxation_method_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "taxationMethod", "taxation_method", "taxation_method_id"
        ),
    )
    customer_type_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "customerType", "customer_type", "customer_type_id"
        ),
    )
    nit: str | None = None


class SupplierCreateIn(CamelSchema):
    """Supplier creation payload."""

    legal_name: str
    tax_id: str
    trade_name: str | None = None
    state_business_registration: str | None = None
    municipal_business_registration: str | None = None
    classification_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices("classification", "classification_id"),
    )
    category_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices("category", "category_id"),
    )
    risk_level_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices("riskLevel", "risk_level", "risk_level_id"),
    )
    type_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices("type", "type_id"),
    )
    address: AddressPayload | None = None
    contact: ContactPayload | None = None
    payment_details: PaymentDetailsPayload | None = None
    organizational_details: OrganizationalDetailsPayload | None = None
    fiscal_details: FiscalDetailsPayload | None = None
    company_information: CompanyInformationPayload | None = None
    contract: ContractPayload | None = None


class SupplierUpdateIn(CamelSchema):
    """Supplier update payload."""

    legal_name: str | None = None
    tax_id: str | None = None
    trade_name: str | None = None
    state_business_registration: str | None = None
    municipal_business_registration: str | None = None
    classification_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices("classification", "classification_id"),
    )
    category_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices("category", "category_id"),
    )
    risk_level_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices("riskLevel", "risk_level", "risk_level_id"),
    )
    type_id: int | None = Field(
        default=None,
        validation_alias=AliasChoices("type", "type_id"),
    )
    address: AddressPayload | None = None
    contact: ContactPayload | None = None
    payment_details: PaymentDetailsPayload | None = None
    organizational_details: OrganizationalDetailsPayload | None = None
    fiscal_details: FiscalDetailsPayload | None = None
    company_information: CompanyInformationPayload | None = None
    contract: ContractPayload | None = None


def _domain_ref(instance):
    if not instance:
        return None
    return DomainRefOut.model_validate(instance).model_dump(by_alias=True)


def _serialize_model(model):
    if not model:
        return None
    data = {}
    for field in model._meta.fields:  # pylint: disable=protected-access
        if field.name in {"id", "created_at", "updated_at"}:
            continue
        key = to_camel_case(field.name)
        if field.is_relation:
            data[key] = getattr(model, field.attname)
            continue
        value = getattr(model, field.name)
        data[key] = value.isoformat() if hasattr(value, "isoformat") else value
    data["id"] = model.id
    data["createdAt"] = model.created_at.isoformat() if model.created_at else None
    data["updatedAt"] = model.updated_at.isoformat() if model.updated_at else None
    return data


def serialize_supplier(instance: Supplier) -> dict[str, Any]:
    """Serialize supplier output with nested objects in camelCase."""
    data: dict[str, Any] = {
        "id": instance.id,
        "name": instance.trade_name or instance.legal_name,
        "tradeName": instance.trade_name,
        "legalName": instance.legal_name,
        "taxId": instance.tax_id,
        "stateBusinessRegistration": instance.state_business_registration,
        "municipalBusinessRegistration": instance.municipal_business_registration,
        "address": _serialize_model(instance.address),
        "contact": _serialize_model(instance.contact),
        "paymentDetails": _serialize_model(instance.payment_details),
        "organizationalDetails": _serialize_model(instance.organizational_details),
        "fiscalDetails": _serialize_model(instance.fiscal_details),
        "companyInformation": _serialize_model(instance.company_information),
        "contract": _serialize_model(instance.contract),
        "classification": _domain_ref(instance.classification),
        "category": _domain_ref(instance.category),
        "riskLevel": _domain_ref(instance.risk_level),
        "type": _domain_ref(instance.type),
        "createdAt": instance.created_at.isoformat() if instance.created_at else None,
        "updatedAt": instance.updated_at.isoformat() if instance.updated_at else None,
    }
    situation = instance.situation
    if situation:
        data["situation"] = {
            "id": situation.id,
            "supplier": situation.supplier_id,
            "status": _domain_ref(situation.status),
            "createdAt": (
                situation.created_at.isoformat() if situation.created_at else None
            ),
            "updatedAt": (
                situation.updated_at.isoformat() if situation.updated_at else None
            ),
        }
    else:
        data["situation"] = None

    if hasattr(instance, "responsibility_matrix") and instance.responsibility_matrix:
        data["responsibilityMatrix"] = serialize_responsibility_matrix(
            instance.responsibility_matrix
        )
    else:
        data["responsibilityMatrix"] = None

    return data
