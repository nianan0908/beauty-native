import pytest
from pydantic import ValidationError

from app.modules.auth.seed import ROLE_PERMISSIONS
from app.modules.schedule.schemas import ScheduleEntry


def test_master_data_permission_matrix() -> None:
    assert {"store:manage", "staff:manage", "service:manage", "schedule:manage"}.issubset(
        ROLE_PERMISSIONS["owner"]
    )
    assert {"staff:manage", "schedule:manage"}.issubset(ROLE_PERMISSIONS["manager"])
    assert "service:manage" not in ROLE_PERMISSIONS["manager"]
    assert "schedule:read" in ROLE_PERMISSIONS["employee"]
    assert "staff:read" not in ROLE_PERMISSIONS["employee"]


def test_work_schedule_requires_ordered_times() -> None:
    with pytest.raises(ValidationError, match="结束时间必须晚于开始时间"):
        ScheduleEntry.model_validate(
            {
                "staffId": "E001",
                "date": "2026-08-14",
                "startTime": "18:30",
                "endTime": "09:30",
                "type": "work",
            }
        )


def test_rest_schedule_can_keep_default_time_window() -> None:
    schedule = ScheduleEntry.model_validate(
        {
            "staffId": "E001",
            "date": "2026-08-14",
            "startTime": "09:30",
            "endTime": "09:30",
            "type": "rest",
        }
    )

    assert schedule.type == "rest"
