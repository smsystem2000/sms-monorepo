import { useQuery } from "@tanstack/react-query";
import useApi from "../useApi";
import type { ApiResponse } from "../../types";

export interface SchoolDashboardStats {
    totalTeachers: number;
    activeTeachers: number;
    totalStudents: number;
    activeStudents: number;
    totalParents: number;
    activeParents: number;
}

// Query Keys
export const schoolDashboardKeys = {
    stats: (schoolId: string) => ["schoolDashboardStats", schoolId] as const,
};

// Get school dashboard stats
export const useGetSchoolDashboardStats = (schoolId: string) => {
    return useQuery({
        queryKey: schoolDashboardKeys.stats(schoolId),
        queryFn: () =>
            useApi<ApiResponse<SchoolDashboardStats>>(
                "GET",
                `/api/school/${schoolId}/dashboard/stats`
            ),
        enabled: !!schoolId,
    });
};
