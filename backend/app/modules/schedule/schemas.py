from datetime import date, time

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ScheduleEntry(BaseModel):
    staff_id: str = Field(alias="staffId")
    date: date
    start_time: time = Field(alias="startTime")
    end_time: time = Field(alias="endTime")
    type: str = Field(pattern="^(work|rest|leave)$")

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="after")
    def validate_work_times(self) -> "ScheduleEntry":
        if self.type == "work" and self.start_time >= self.end_time:
            raise ValueError("上班排班的结束时间必须晚于开始时间")
        return self


class ScheduleBatchUpdate(BaseModel):
    entries: list[ScheduleEntry] = Field(min_length=1, max_length=500)


class ScheduleView(BaseModel):
    id: str
    tenant_id: str = Field(alias="tenantId")
    store_id: str = Field(alias="storeId")
    staff_id: str = Field(alias="staffId")
    date: date
    start_time: time = Field(alias="startTime")
    end_time: time = Field(alias="endTime")
    type: str

    model_config = ConfigDict(populate_by_name=True)
