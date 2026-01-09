import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type {
    ApiResponse,
    SchoolAdmin,
    CreateSchoolAdminPayload,
    UpdateSchoolAdminPayload,
} from "../../types";

// Query Keys
export const schoolAdminKeys = {
    all: ["schoolAdmins"] as const,
    detail: (userId: string) => ["schoolAdmins", userId] as const,
};

// Get all school admins
export const useGetSchoolAdmins = () => {
    return useQuery({
        queryKey: schoolAdminKeys.all,
        queryFn: () =>
            useApi<ApiResponse<SchoolAdmin[]>>("GET", "/api/admin/user/get-users"),
    });
};

// Get school admin by ID
export const useGetSchoolAdminById = (userId: string) => {
    return useQuery({
        queryKey: schoolAdminKeys.detail(userId),
        queryFn: () =>
            useApi<ApiResponse<SchoolAdmin>>("GET", `/api/admin/user/get-user/${userId}`),
        enabled: !!userId,
    });
};

// Create school admin
export const useCreateSchoolAdmin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateSchoolAdminPayload) =>
            useApi<ApiResponse<SchoolAdmin>>("POST", "/api/admin/user/create-user", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: schoolAdminKeys.all });
        },
    });
};

// Update school admin
export const useUpdateSchoolAdmin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            userId,
            data,
        }: {
            userId: string;
            data: UpdateSchoolAdminPayload;
        }) =>
            useApi<ApiResponse<SchoolAdmin>>(
                "PUT",
                `/api/admin/user/update-user/${userId}`,
                data
            ),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: schoolAdminKeys.all });
            queryClient.invalidateQueries({
                queryKey: schoolAdminKeys.detail(variables.userId),
            });
        },
    });
};
