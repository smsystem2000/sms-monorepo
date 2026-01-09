import { useQuery } from "@tanstack/react-query";
import useApi from "../useApi";
import type { ApiResponse } from "../../types";

export interface DashboardStats {
    totalSchools: number;
    totalUsers: number;
    activeSchools: number;
    activeUsers: number;
}

// Query Keys
export const dashboardKeys = {
    stats: ["dashboardStats"] as const,
};

// Get dashboard stats
export const useGetDashboardStats = () => {
    return useQuery({
        queryKey: dashboardKeys.stats,
        queryFn: () =>
            useApi<ApiResponse<DashboardStats>>("GET", "/api/admin/dashboard/stats"),
    });
};
