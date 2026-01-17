import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type { Homework, CreateHomeworkPayload, UpdateHomeworkPayload } from "../../types";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    count?: number;
}

// Query Keys
export const homeworkKeys = {
    all: ['homework'] as const,
    lists: () => [...homeworkKeys.all, 'list'] as const,
    byClass: (schoolId: string, classId: string) => [...homeworkKeys.lists(), 'class', schoolId, classId] as const,
    byStudent: (schoolId: string, studentId: string) => [...homeworkKeys.lists(), 'student', schoolId, studentId] as const,
    upcoming: (schoolId: string, studentId: string) => [...homeworkKeys.lists(), 'upcoming', schoolId, studentId] as const,
    byTeacher: (schoolId: string, teacherId: string) => [...homeworkKeys.lists(), 'teacher', schoolId, teacherId] as const,
    details: () => [...homeworkKeys.all, 'detail'] as const,
    detail: (schoolId: string, id: string) => [...homeworkKeys.details(), schoolId, id] as const,
};

// Get homework by class
export const useGetHomeworkByClass = (
    schoolId: string,
    classId: string,
    filters?: { sectionId?: string; status?: string; subjectId?: string }
) => {
    return useQuery({
        queryKey: homeworkKeys.byClass(schoolId, classId),
        queryFn: () => useApi<ApiResponse<Homework[]>>(
            "GET",
            `/api/academics/school/${schoolId}/homework/class/${classId}`,
            undefined,
            filters as Record<string, unknown>
        ),
        enabled: !!schoolId && !!classId,
    });
};

// Get homework by student
export const useGetHomeworkByStudent = (
    schoolId: string,
    studentId: string,
    filters?: { status?: string; subjectId?: string }
) => {
    return useQuery({
        queryKey: homeworkKeys.byStudent(schoolId, studentId),
        queryFn: () => useApi<ApiResponse<Homework[]>>(
            "GET",
            `/api/academics/school/${schoolId}/homework/student/${studentId}`,
            undefined,
            filters as Record<string, unknown>
        ),
        enabled: !!schoolId && !!studentId,
    });
};

// Get upcoming homework for student
export const useGetUpcomingHomework = (
    schoolId: string,
    studentId: string,
    limit?: number
) => {
    return useQuery({
        queryKey: homeworkKeys.upcoming(schoolId, studentId),
        queryFn: () => useApi<ApiResponse<Homework[]>>(
            "GET",
            `/api/academics/school/${schoolId}/homework/upcoming/${studentId}`,
            undefined,
            limit ? { limit } : undefined
        ),
        enabled: !!schoolId && !!studentId,
    });
};

// Get teacher's homework
export const useGetTeacherHomework = (
    schoolId: string,
    teacherId: string,
    filters?: { status?: string; classId?: string }
) => {
    return useQuery({
        queryKey: homeworkKeys.byTeacher(schoolId, teacherId),
        queryFn: () => useApi<ApiResponse<Homework[]>>(
            "GET",
            `/api/academics/school/${schoolId}/homework/teacher/${teacherId}`,
            undefined,
            filters as Record<string, unknown>
        ),
        enabled: !!schoolId && !!teacherId,
    });
};

// Get homework by ID
export const useGetHomeworkById = (schoolId: string, homeworkId: string) => {
    return useQuery({
        queryKey: homeworkKeys.detail(schoolId, homeworkId),
        queryFn: () => useApi<ApiResponse<Homework>>(
            "GET",
            `/api/academics/school/${schoolId}/homework/${homeworkId}`
        ),
        enabled: !!schoolId && !!homeworkId,
    });
};

// Create homework
export const useCreateHomework = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateHomeworkPayload) => useApi(
            "POST",
            `/api/academics/school/${schoolId}/homework`,
            payload
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
        },
    });
};

// Update homework
export const useUpdateHomework = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ homeworkId, ...payload }: UpdateHomeworkPayload & { homeworkId: string }) => useApi(
            "PUT",
            `/api/academics/school/${schoolId}/homework/${homeworkId}`,
            payload
        ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
            queryClient.invalidateQueries({ queryKey: homeworkKeys.detail(schoolId, variables.homeworkId) });
        },
    });
};

// Delete homework
export const useDeleteHomework = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (homeworkId: string) => useApi(
            "DELETE",
            `/api/academics/school/${schoolId}/homework/${homeworkId}`
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
        },
    });
};
