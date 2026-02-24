from pydantic import BaseModel


class AdminDashboardStatsResponse(BaseModel):
    total_users: int
    total_tournaments: int
    active_tournaments: int
    total_revenue: float
