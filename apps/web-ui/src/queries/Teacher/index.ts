import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type {
    ApiResponse,
    Teacher,
    CreateTeacherPayload,
    UpdateTeacherPayload,
    TeacherFilters,
} from "../../types";

// Query Keys
export const teacherKeys = {
    all: (schoolId: string) => ["teachers", schoolId] as const,
    detail: (schoolId: string, teacherId: string) =>
        ["teachers", schoolId, teacherId] as const,
    filtered: (schoolId: string, filters: TeacherFilters) =>
        ["teachers", schoolId, filters] as const,
};

// Get all teachers in a school
export const useGetTeachers = (schoolId: string, filters?: TeacherFilters) => {
    return useQuery({
        queryKey: filters
            ? teacherKeys.filtered(schoolId, filters)
            : teacherKeys.all(schoolId),
        queryFn: () =>
            useApi<ApiResponse<Teacher[]>>(
                "GET",
                `/api/school/${schoolId}/teachers`,
                undefined,
                filters as Record<string, unknown>
            ),
        enabled: !!schoolId,
    });
};

// Get teacher by ID
export const useGetTeacherById = (schoolId: string, teacherId: string) => {
    return useQuery({
        queryKey: teacherKeys.detail(schoolId, teacherId),
        queryFn: () =>
            useApi<ApiResponse<Teacher>>(
                "GET",
                `/api/school/${schoolId}/teachers/${teacherId}`
            ),
        enabled: !!schoolId && !!teacherId,
    });
};

// Create teacher
export const useCreateTeacher = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTeacherPayload) =>
            useApi<ApiResponse<Teacher>>(
                "POST",
                `/api/school/${schoolId}/teachers`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: teacherKeys.all(schoolId) });
        },
    });
};

// Update teacher
export const useUpdateTeacher = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            teacherId,
            data,
        }: {
            teacherId: string;
            data: UpdateTeacherPayload;
        }) =>
            useApi<ApiResponse<Teacher>>(
                "PUT",
                `/api/school/${schoolId}/teachers/${teacherId}`,
                data
            ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: teacherKeys.all(schoolId) });
            queryClient.invalidateQueries({
                queryKey: teacherKeys.detail(schoolId, variables.teacherId),
            });
        },
    });
};

// Delete teacher (soft delete)
export const useDeleteTeacher = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (teacherId: string) =>
            useApi<ApiResponse<Teacher>>(
                "DELETE",
                `/api/school/${schoolId}/teachers/${teacherId}`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: teacherKeys.all(schoolId) });
        },
    });
};

