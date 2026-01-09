import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type {
    ApiResponse,
    Request,
    CreateRequestPayload,
    UpdateRequestPayload,
    RequestFilters,
} from "../../types";

// Query Keys
export const requestKeys = {
    all: (schoolId: string) => ["requests", schoolId] as const,
    my: (schoolId: string, userId: string, userType: string) =>
        ["requests", schoolId, "my", userId, userType] as const,
    filtered: (schoolId: string, filters: RequestFilters) =>
        ["requests", schoolId, filters] as const,
};

// Get all requests (admin only)
export const useGetAllRequests = (schoolId: string, filters?: RequestFilters) => {
    return useQuery({
        queryKey: filters
            ? requestKeys.filtered(schoolId, filters)
            : requestKeys.all(schoolId),
        queryFn: () =>
            useApi<ApiResponse<Request[]>>(
                "GET",
                `/api/school/${schoolId}/requests`,
                undefined,
                filters as Record<string, unknown>
            ),
        enabled: !!schoolId,
    });
};

// Get my requests
export const useGetMyRequests = (
    schoolId: string,
    userId: string,
    userType: string
) => {
    return useQuery({
        queryKey: requestKeys.my(schoolId, userId, userType),
        queryFn: () =>
            useApi<ApiResponse<Request[]>>(
                "GET",
                `/api/school/${schoolId}/requests/my`,
                undefined,
                { userId, userType }
            ),
        enabled: !!schoolId && !!userId && !!userType,
    });
};

// Create request
export const useCreateRequest = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateRequestPayload) =>
            useApi<ApiResponse<Request>>(
                "POST",
                `/api/school/${schoolId}/requests`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["requests", schoolId] });
        },
    });
};

// Update request status (admin only)
export const useUpdateRequestStatus = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            requestId,
            data,
        }: {
            requestId: string;
            data: UpdateRequestPayload;
        }) =>
            useApi<ApiResponse<Request>>(
                "PUT",
                `/api/school/${schoolId}/requests/${requestId}`,
                data
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: requestKeys.all(schoolId) });
        },
    });
};
