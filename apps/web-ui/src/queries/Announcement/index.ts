import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type { Announcement, CreateAnnouncementPayload, UpdateAnnouncementPayload } from "../../types";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

// Query Keys
export const announcementKeys = {
    all: ['announcements'] as const,
    lists: () => [...announcementKeys.all, 'list'] as const,
    list: (schoolId: string, filters?: Record<string, unknown>) => [...announcementKeys.lists(), schoolId, filters] as const,
    my: (schoolId: string) => [...announcementKeys.all, 'my', schoolId] as const,
    details: () => [...announcementKeys.all, 'detail'] as const,
    detail: (schoolId: string, id: string) => [...announcementKeys.details(), schoolId, id] as const,
};

// Get all announcements (filtered by role)
export const useGetAnnouncements = (
    schoolId: string,
    filters?: { category?: string; status?: string; page?: number; limit?: number }
) => {
    return useQuery({
        queryKey: announcementKeys.list(schoolId, filters),
        queryFn: () => useApi<ApiResponse<Announcement[]>>(
            "GET",
            `/api/notifications/school/${schoolId}/announcements`,
            undefined,
            filters as Record<string, unknown>
        ),
        enabled: !!schoolId,
    });
};

// Get single announcement by ID
export const useGetAnnouncementById = (schoolId: string, announcementId: string) => {
    return useQuery({
        queryKey: announcementKeys.detail(schoolId, announcementId),
        queryFn: () => useApi<ApiResponse<Announcement>>(
            "GET",
            `/api/notifications/school/${schoolId}/announcements/${announcementId}`
        ),
        enabled: !!schoolId && !!announcementId,
    });
};

// Get my announcements (for teachers)
export const useGetMyAnnouncements = (schoolId: string) => {
    return useQuery({
        queryKey: announcementKeys.my(schoolId),
        queryFn: () => useApi<ApiResponse<Announcement[]>>(
            "GET",
            `/api/notifications/school/${schoolId}/announcements/my`
        ),
        enabled: !!schoolId,
    });
};

// Create announcement
export const useCreateAnnouncement = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateAnnouncementPayload) => useApi(
            "POST",
            `/api/notifications/school/${schoolId}/announcements`,
            payload
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
            queryClient.invalidateQueries({ queryKey: announcementKeys.my(schoolId) });
        },
    });
};

// Update announcement
export const useUpdateAnnouncement = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ announcementId, ...payload }: UpdateAnnouncementPayload & { announcementId: string }) => useApi(
            "PUT",
            `/api/notifications/school/${schoolId}/announcements/${announcementId}`,
            payload
        ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
            queryClient.invalidateQueries({ queryKey: announcementKeys.detail(schoolId, variables.announcementId) });
            queryClient.invalidateQueries({ queryKey: announcementKeys.my(schoolId) });
        },
    });
};

// Delete (archive) announcement
export const useDeleteAnnouncement = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (announcementId: string) => useApi(
            "DELETE",
            `/api/notifications/school/${schoolId}/announcements/${announcementId}`
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
            queryClient.invalidateQueries({ queryKey: announcementKeys.my(schoolId) });
        },
    });
};
