"""Tests for people module and employee creation logic."""

from datetime import date

import pytest
from fastapi.exceptions import HTTPException
from sqlalchemy.orm import Session
from src.auth.models import UserModel
from src.datasync.models import (
    EmployeeEducationalLevelTOTVSModel,
    EmployeeGenderTOTVSModel,
    EmployeeMaritalStatusTOTVSModel,
    EmployeeNationalityTOTVSModel,
    EmployeeRoleTOTVSModel,
)
from src.people.models import EmployeeModel
from src.people.schemas import NewEmployeeSchema
from src.people.service import EmployeeService
from src.tests.base import TestBase


class TestPeopleModule(TestBase):
    """Test suite for Employee creation and people service operations."""

    def _seed_nested_models(self, db_session: Session) -> dict:
        """Helper to seed required nested models in DB."""
        role = EmployeeRoleTOTVSModel(code="DEV", name="Desenvolvedor")
        nationality = EmployeeNationalityTOTVSModel(code="BR", description="Brasil")
        marital_status = EmployeeMaritalStatusTOTVSModel(
            code="S", description="Solteiro"
        )
        gender = EmployeeGenderTOTVSModel(code="M", description="Masculino")
        educational_level = EmployeeEducationalLevelTOTVSModel(
            code="SUP", description="Superior"
        )

        db_session.add_all(
            [role, nationality, marital_status, gender, educational_level]
        )
        db_session.commit()

        return {
            "role": role,
            "nationality": nationality,
            "marital_status": marital_status,
            "gender": gender,
            "educational_level": educational_level,
        }

    def test_create_employee_success(self, setup):
        """Test creating a new employee succeeds and generates a code."""
        db_session = self.testing_session_local()
        nested = self._seed_nested_models(db_session)
        service = EmployeeService()

        new_user = UserModel(username="test_user", email="test@solutis.com.br")
        db_session.add(new_user)
        db_session.commit()

        data = NewEmployeeSchema(
            fullName="NOVO COLABORADOR TESTE",
            taxpayerIdentification="12345678901",
            nationalIdentification="123456789",
            address="AVENIDA TANCREDO NEVES;1485;SN;CAMINHO DAS ARVORES;SALVADOR;BAHIA;BRASIL;41820770",
            cellPhone="71999999999",
            email="novo@solutis.com.br",
            birthday=date(1990, 1, 1),
            role=nested["role"].id,
            nationalityId=nested["nationality"].id,
            maritalStatusId=nested["marital_status"].id,
            genderId=nested["gender"].id,
            educationalLevelId=nested["educational_level"].id,
            employerName="SOLUTIS TECNOLOGIA",
            employerNumber="12345678000199",
        )

        res = service.create_employee(data, db_session, new_user)
        assert res.full_name == "NOVO COLABORADOR TESTE"
        assert res.taxpayer_identification == "12345678901"
        assert res.registration is not None
        assert len(res.registration) <= 16

    def test_create_employee_when_db_is_empty(self, setup):
        """Test creating an employee when 0 employees exist in database (last_employee is None)."""
        db_session = self.testing_session_local()
        nested = self._seed_nested_models(db_session)
        service = EmployeeService()

        new_user = UserModel(username="test_user2", email="test2@solutis.com.br")
        db_session.add(new_user)
        db_session.commit()

        data = NewEmployeeSchema(
            fullName="PRIMEIRO COLABORADOR",
            taxpayerIdentification="98765432100",
            nationalIdentification="",
            address="RUA TESTE, 100",
            cellPhone="71988888888",
            email="primeiro@solutis.com.br",
            birthday=date(1995, 5, 5),
            nationalityId=nested["nationality"].id,
            maritalStatusId=nested["marital_status"].id,
            genderId=nested["gender"].id,
            educationalLevelId=nested["educational_level"].id,
            employerName="SOLUTIS",
            employerNumber="12345678000199",
        )

        res = service.create_employee(data, db_session, new_user)
        assert res.full_name == "PRIMEIRO COLABORADOR"

    def test_create_employee_duplicate_cpf_returns_400(self, setup):
        """Test creating an employee with existing taxpayer_identification raises 400."""
        db_session = self.testing_session_local()
        nested = self._seed_nested_models(db_session)
        service = EmployeeService()

        new_user = UserModel(username="user_cpf", email="cpf@solutis.com.br")
        db_session.add(new_user)

        # Existing CLT employee with CPF 11122233344
        emp_existing = EmployeeModel(
            full_name="EXISTING EMP",
            taxpayer_identification="11122233344",
            national_identification="123",
            address="RUA A",
            cell_phone="71900000000",
            email="existing@solutis.com.br",
            birthday=date(1985, 1, 1),
            gender=nested["gender"],
            legal_person=False,
        )
        db_session.add(emp_existing)
        db_session.commit()

        data = NewEmployeeSchema(
            fullName="DUPLICATE CPF",
            taxpayerIdentification="11122233344",
            nationalIdentification="999",
            address="RUA B",
            cellPhone="71911111111",
            email="dup@solutis.com.br",
            birthday=date(1990, 2, 2),
            nationalityId=nested["nationality"].id,
            maritalStatusId=nested["marital_status"].id,
            genderId=nested["gender"].id,
            educationalLevelId=nested["educational_level"].id,
            employerName="SOLUTIS",
            employerNumber="12345678000199",
        )

        with pytest.raises(HTTPException) as exc_info:
            service.create_employee(data, db_session, new_user)

        assert exc_info.value.status_code == 400
        assert exc_info.value.detail[0]["field"] == "taxpayerIdentification"

    def test_serialize_employee_handles_none_gender(self, setup):
        """Test serialize_employee does not fail when employee.gender is None."""
        service = EmployeeService()
        emp = EmployeeModel(
            id=99,
            full_name="NO GENDER EMP",
            taxpayer_identification="99988877766",
            national_identification="112233",
            address="RUA C",
            cell_phone="71922222222",
            email="nogender@solutis.com.br",
            birthday=date(1992, 3, 3),
            status="Ativo",
            legal_person=True,
            gender=None,
        )
        res = service.serialize_employee(emp)
        assert res.full_name == "NO GENDER EMP"
        assert res.gender is None

    def test_new_employee_schema_coerces_empty_strings_to_none(self, setup):
        """Test NewEmployeeSchema converts empty strings for optional fields to None."""
        db_session = self.testing_session_local()
        nested = self._seed_nested_models(db_session)
        data = NewEmployeeSchema(
            fullName="TESTE STRINGS VAZIAS",
            taxpayerIdentification="55544433322",
            nationalIdentification="",
            address="AVENIDA TANCREDO NEVES;1485;;CAMINHO DAS ARVORES;SALVADOR;BAHIA;BRASIL;41820770",
            cellPhone="71977777777",
            email="vazias@solutis.com.br",
            birthday=date(1991, 4, 4),
            role="",
            code="",
            employerContractDate="",
            employerEndContractDate="",
            employerNumber="",
            nationalityId=nested["nationality"].id,
            maritalStatusId=nested["marital_status"].id,
            genderId=nested["gender"].id,
            educationalLevelId=nested["educational_level"].id,
        )
        assert data.role is None
        assert data.code is None
        assert data.employer_contract_date is None
        assert data.employer_end_contract_date is None
        assert data.employer_number is None

    def test_create_employee_with_empty_optional_fields_and_address(self, setup):
        """Test creating an employee with coerced empty optional fields and no address complement."""
        db_session = self.testing_session_local()
        nested = self._seed_nested_models(db_session)
        service = EmployeeService()
        new_user = UserModel(username="user_empty_fields", email="empty@solutis.com.br")
        db_session.add(new_user)
        db_session.commit()

        data = NewEmployeeSchema(
            fullName="COLABORADOR ENDERECO LIMPO",
            taxpayerIdentification="44433322211",
            nationalIdentification="",
            address="AVENIDA TANCREDO NEVES;1485;;CAMINHO DAS ARVORES;SALVADOR;BAHIA;BRASIL;41820770",
            cellPhone="71966666666",
            email="clean@solutis.com.br",
            birthday=date(1993, 6, 6),
            role="",
            employerContractDate="",
            employerEndContractDate="",
            employerNumber="",
            nationalityId=nested["nationality"].id,
            maritalStatusId=nested["marital_status"].id,
            genderId=nested["gender"].id,
            educationalLevelId=nested["educational_level"].id,
        )

        res = service.create_employee(data, db_session, new_user)
        assert res.full_name == "COLABORADOR ENDERECO LIMPO"
        assert "UNDEFINED" not in res.address
        assert res.role is None

    def test_new_employee_schema_parses_brazilian_dates(self, setup):
        """Test NewEmployeeSchema correctly parses Brazilian DD/MM/YYYY date strings into date objects."""
        db_session = self.testing_session_local()
        nested = self._seed_nested_models(db_session)
        data = NewEmployeeSchema(
            fullName="TESTE DATA BRASILEIRA",
            taxpayerIdentification="99900011122",
            address="RUA BRASIL, 123",
            cellPhone="71999998888",
            email="databr@solutis.com.br",
            birthday="15/05/1995",
            employerContractDate="01/02/2020",
            employerEndContractDate="31/12/2025",
            nationalityId=nested["nationality"].id,
            maritalStatusId=nested["marital_status"].id,
            genderId=nested["gender"].id,
            educationalLevelId=nested["educational_level"].id,
        )
        assert data.birthday == date(1995, 5, 15)
        assert data.employer_contract_date == date(2020, 2, 1)
        assert data.employer_end_contract_date == date(2025, 12, 31)
