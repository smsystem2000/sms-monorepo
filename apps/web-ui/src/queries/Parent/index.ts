import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type {
    ApiResponse,
    Parent,
    CreateParentPayload,
    UpdateParentPayload,
    ParentFilters,
} from "../../types";

// Query Keys
export const parentKeys = {
    all: (schoolId: string) => ["parents", schoolId] as const,
    detail: (schoolId: string, parentId: string) =>
        ["parents", schoolId, parentId] as const,
    byStudent: (schoolId: string, studentId: string) =>
        ["parents", schoolId, "student", studentId] as const,
    filtered: (schoolId: string, filters: ParentFilters) =>
        ["parents", schoolId, filters] as const,
};

// Get all parents in a school
export const useGetParents = (schoolId: string, filters?: ParentFilters) => {
    return useQuery({
        queryKey: filters
            ? parentKeys.filtered(schoolId, filters)
            : parentKeys.all(schoolId),
        queryFn: () =>
            useApi<ApiResponse<Parent[]>>(
                "GET",
                `/api/school/${schoolId}/parents`,
                undefined,
                filters as Record<string, unknown>
            ),
        enabled: !!schoolId,
    });
};

// Get parent by ID
export const useGetParentById = (schoolId: string, parentId: string) => {
    return useQuery({
        queryKey: parentKeys.detail(schoolId, parentId),
        queryFn: () =>
            useApi<ApiResponse<Parent>>(
                "GET",
                `/api/school/${schoolId}/parents/${parentId}`
            ),
        enabled: !!schoolId && !!parentId,
    });
};

// Get parents by student ID
export const useGetParentsByStudentId = (
    schoolId: string,
    studentId: string
) => {
    return useQuery({
        queryKey: parentKeys.byStudent(schoolId, studentId),
        queryFn: () =>
            useApi<ApiResponse<Parent[]>>(
                "GET",
                `/api/school/${schoolId}/parents/student/${studentId}`
            ),
        enabled: !!schoolId && !!studentId,
    });
};

// Create parent
export const useCreateParent = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateParentPayload) =>
            useApi<ApiResponse<Parent>>(
                "POST",
                `/api/school/${schoolId}/parents`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: parentKeys.all(schoolId) });
        },
    });
};

// Update parent
export const useUpdateParent = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            parentId,
            data,
        }: {
            parentId: string;
            data: UpdateParentPayload;
        }) =>
            useApi<ApiResponse<Parent>>(
                "PUT",
                `/api/school/${schoolId}/parents/${parentId}`,
                data
            ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: parentKeys.all(schoolId) });
            queryClient.invalidateQueries({
                queryKey: parentKeys.detail(schoolId, variables.parentId),
            });
        },
    });
};

// Delete parent (soft delete)
export const useDeleteParent = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (parentId: string) =>
            useApi<ApiResponse<Parent>>(
                "DELETE",
                `/api/school/${schoolId}/parents/${parentId}`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: parentKeys.all(schoolId) });
        },
    });
};

// Search parents for autocomplete
export const searchParentsApi = (schoolId: string, query: string) =>
    useApi<ApiResponse<Parent[]>>(
        "GET",
        `/api/school/${schoolId}/parents/search`,
        undefined,
        { query }
    );

