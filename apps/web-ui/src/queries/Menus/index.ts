import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../useApi";
import type { ApiResponse, Menu, CreateMenuPayload } from "../../types";

// Get menus based on role
export const useGetSuperAdminMenus = (role: string) => {
  return useQuery({
    queryKey: ["menus", "superadmin", role],
    queryFn: () =>
      useApi<ApiResponse<Menu[]>>("GET", `/api/admin/dashboard/menus/${role}`),
    enabled: !!role,
  });
};

// Get menus for school admin/staff based on schoolId and role
export const useGetSchoolAdminMenus = (schoolId: string, role: string) => {
  return useQuery({
    queryKey: ["menus", schoolId, role],
    queryFn: () =>
      useApi<ApiResponse<Menu[]>>(
        "GET",
        `/api/auth/${schoolId}/dashboard/menus/${role}`,
      ),
    enabled: !!schoolId && !!role,
  });
};

// Get menus for student/teacher/parent based on schoolId and role
export const useGetUserMenus = (schoolId: string, role: string) => {
  return useQuery({
    queryKey: ["menus", "user", schoolId, role],
    queryFn: () =>
      useApi<ApiResponse<Menu[]>>(
        "GET",
        `/api/school/${schoolId}/dashboard/menus/${role}`,
      ),
    enabled: !!schoolId && !!role,
  });
};

// Get all menus (for management)
export const useGetMenus = () => {
  return useQuery({
    queryKey: ["menus", "all"],
    queryFn: () =>
      useApi<ApiResponse<Menu[]>>("GET", "/api/admin/dashboard/menus/all"), // Assumed endpoint
  });
};

// Create Menu
export const useCreateMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMenuPayload) =>
      useApi<ApiResponse<Menu>>("POST", "/api/admin/dashboard/menus", data), // Assumed endpoint
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });
};

// Update Menu
export const useUpdateMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      menuId,
      data,
    }: {
      menuId: string;
      data: Partial<CreateMenuPayload>;
    }) =>
      useApi<ApiResponse<Menu>>(
        "PUT",
        `/api/admin/dashboard/menus/${menuId}`,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });
};

// Delete Menu
export const useDeleteMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (menuId: string) =>
      useApi<ApiResponse<void>>(
        "DELETE",
        `/api/admin/dashboard/menus/${menuId}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });
};
