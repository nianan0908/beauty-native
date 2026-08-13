from sqlalchemy import CheckConstraint, Table, UniqueConstraint

from app.core.database import Base
from app.models import BeautyService, StaffProfile, StaffSchedule


def test_staff_service_and_schedule_models_are_registered() -> None:
    assert StaffProfile.__table__ is Base.metadata.tables["staff_profiles"]
    assert BeautyService.__table__ is Base.metadata.tables["services"]
    assert StaffSchedule.__table__ is Base.metadata.tables["staff_schedules"]
    assert "service_store_relations" in Base.metadata.tables
    assert "staff_service_relations" in Base.metadata.tables


def test_staff_and_schedule_business_constraints_are_registered() -> None:
    staff_table = StaffProfile.__table__
    schedule_table = StaffSchedule.__table__
    assert isinstance(staff_table, Table)
    assert isinstance(schedule_table, Table)
    staff_uniques = {
        tuple(constraint.columns.keys())
        for constraint in staff_table.constraints
        if isinstance(constraint, UniqueConstraint)
    }
    schedule_uniques = {
        tuple(constraint.columns.keys())
        for constraint in schedule_table.constraints
        if isinstance(constraint, UniqueConstraint)
    }
    schedule_checks = {
        constraint.name
        for constraint in schedule_table.constraints
        if isinstance(constraint, CheckConstraint)
    }

    assert ("tenant_id", "phone") in staff_uniques
    assert ("staff_id", "work_date") in schedule_uniques
    assert "ck_staff_schedules_work_time_order" in schedule_checks
