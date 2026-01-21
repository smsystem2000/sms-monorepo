import { useQuery } from "@tanstack/react-query";
import useApi from "../useApi";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface TeacherDashboardStats {
    totalClasses: number;
    totalStudents: number;
    periodsToday: number;
    pendingLeaveRequests: number;
    totalAnnouncements: number;
}

// Query Keys
export const teacherDashboardKeys = {
    all: ['teacherDashboard'] as const,
    stats: (schoolId: string) => [...teacherDashboardKeys.all, 'stats', schoolId] as const,
};

// Get Teacher Dashboard Stats
export const useGetTeacherDashboardStats = (schoolId: string) => {
    return useQuery({
        queryKey: teacherDashboardKeys.stats(schoolId),
        queryFn: () => useApi<ApiResponse<TeacherDashboardStats>>(
            "GET",
            `/api/school/${schoolId}/dashboard/teacher-stats`
        ),
        enabled: !!schoolId,
    });
};
