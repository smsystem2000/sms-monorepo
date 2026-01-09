import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type {
    ApiResponse,
    School,
    CreateSchoolPayload,
    UpdateSchoolPayload,
} from "../../types";

// Query Keys
export const schoolKeys = {
    all: ["schools"] as const,
    detail: (schoolId: string) => ["schools", schoolId] as const,
};

// Get all schools
export const useGetSchools = () => {
    return useQuery({
        queryKey: schoolKeys.all,
        queryFn: () => useApi<ApiResponse<School[]>>("GET", "/api/admin/school/get-all-schools"),
    });
};

// Get school by ID
export const useGetSchoolById = (schoolId: string) => {
    return useQuery({
        queryKey: schoolKeys.detail(schoolId),
        queryFn: () =>
            useApi<ApiResponse<School>>("GET", `/api/admin/school/get-school/${schoolId}`),
        enabled: !!schoolId,
    });
};

// Create school
export const useCreateSchool = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateSchoolPayload) =>
            useApi<ApiResponse<School>>("POST", "/api/admin/school/create-school", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: schoolKeys.all });
        },
    });
};

// Update school
export const useUpdateSchool = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            schoolId,
            data,
        }: {
            schoolId: string;
            data: UpdateSchoolPayload;
        }) =>
            useApi<ApiResponse<School>>("PUT", `/api/admin/school/update-school/${schoolId}`, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: schoolKeys.all });
            queryClient.invalidateQueries({
                queryKey: schoolKeys.detail(variables.schoolId),
            });
        },
    });
};
