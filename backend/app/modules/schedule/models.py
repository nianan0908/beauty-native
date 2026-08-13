import secrets
from datetime import UTC, date, datetime, time

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, String, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def utc_now() -> datetime:
    return datetime.now(UTC)


def new_schedule_id() -> str:
    return f"SH{secrets.token_hex(10).upper()}"


class StaffSchedule(Base):
    __tablename__ = "staff_schedules"
    __table_args__ = (
        CheckConstraint(
            "schedule_type != 'work' OR start_time < end_time",
            name="work_time_order",
        ),
        UniqueConstraint("staff_id", "work_date"),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_schedule_id)
    tenant_id: Mapped[str] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True
    )
    store_id: Mapped[str] = mapped_column(
        ForeignKey("stores.id", ondelete="RESTRICT"), index=True
    )
    staff_id: Mapped[str] = mapped_column(
        ForeignKey("staff_profiles.id", ondelete="CASCADE"), index=True
    )
    work_date: Mapped[date] = mapped_column(Date, index=True)
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    schedule_type: Mapped[str] = mapped_column(String(20), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )
