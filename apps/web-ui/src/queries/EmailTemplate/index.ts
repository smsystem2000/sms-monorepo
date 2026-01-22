import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useApi from '../useApi';
import type {
    EmailTemplatesResponse,
    EmailTemplateResponse,
    CreateEmailTemplateInput,
    UpdateEmailTemplateInput,
    TemplateTypesResponse,
    PlaceholdersResponse,
    PreviewTemplateInput,
    PreviewTemplateResult,
    TemplateType,
} from '../../types/emailTemplate';

/**
 * Fetch all email templates for a school
 */
export const useEmailTemplates = (schoolId: string, type?: TemplateType, active?: boolean) => {
    return useQuery({
        queryKey: ['emailTemplates', schoolId, type, active],
        queryFn: async () => {
            const params: Record<string, unknown> = {};
            if (type) params.type = type;
            if (active !== undefined) params.active = String(active);

            return await useApi<EmailTemplatesResponse>(
                'GET',
                `/api/school/${schoolId}/email-templates`,
                undefined,
                params
            );
        },
        enabled: !!schoolId,
    });
};

/**
 * Fetch single email template by ID
 */
export const useEmailTemplate = (schoolId: string, templateId?: string) => {
    return useQuery({
        queryKey: ['emailTemplate', schoolId, templateId],
        queryFn: async () => {
            const response = await useApi<EmailTemplateResponse>(
                'GET',
                `/api/school/${schoolId}/email-templates/${templateId}`
            );
            return response.template;
        },
        enabled: !!schoolId && !!templateId,
    });
};

/**
 * Create new email template
 */
export const useCreateEmailTemplate = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateEmailTemplateInput) => {
            const response = await useApi<EmailTemplateResponse>(
                'POST',
                `/api/school/${schoolId}/email-templates`,
                data
            );
            return response.template;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emailTemplates', schoolId] });
        },
    });
};

/**
 * Update email template
 */
export const useUpdateEmailTemplate = (schoolId: string, templateId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateEmailTemplateInput) => {
            const response = await useApi<EmailTemplateResponse>(
                'PUT',
                `/api/school/${schoolId}/email-templates/${templateId}`,
                data
            );
            return response.template;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emailTemplates', schoolId] });
            queryClient.invalidateQueries({ queryKey: ['emailTemplate', schoolId, templateId] });
        },
    });
};

/**
 * Delete email template
 */
export const useDeleteEmailTemplate = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (templateId: string) => {
            await useApi<void>(
                'DELETE',
                `/api/school/${schoolId}/email-templates/${templateId}`
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emailTemplates', schoolId] });
        },
    });
};

/**
 * Duplicate email template
 */
export const useDuplicateEmailTemplate = (schoolId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (templateId: string) => {
            const response = await useApi<EmailTemplateResponse>(
                'POST',
                `/api/school/${schoolId}/email-templates/${templateId}/duplicate`,
                {}
            );
            return response.template;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emailTemplates', schoolId] });
        },
    });
};

/**
 * Get available template types
 */
export const useTemplateTypes = (schoolId: string) => {
    return useQuery({
        queryKey: ['templateTypes', schoolId],
        queryFn: async () => {
            const response = await useApi<TemplateTypesResponse>(
                'GET',
                `/api/school/${schoolId}/email-templates/types`
            );
            return response.types;
        },
        enabled: !!schoolId,
        staleTime: Infinity, // Types don't change often
    });
};

/**
 * Get placeholders for a template type
 */
export const usePlaceholders = (schoolId: string, type?: TemplateType) => {
    return useQuery({
        queryKey: ['placeholders', schoolId, type],
        queryFn: async () => {
            const response = await useApi<PlaceholdersResponse>(
                'GET',
                `/api/school/${schoolId}/email-templates/placeholders/${type}`
            );
            return response.placeholders;
        },
        enabled: !!schoolId && !!type,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Preview template with sample data
 */
export const usePreviewTemplate = (schoolId: string, templateId: string) => {
    return useMutation({
        mutationFn: async (data: PreviewTemplateInput) => {
            return await useApi<PreviewTemplateResult>(
                'POST',
                `/api/school/${schoolId}/email-templates/${templateId}/preview`,
                data
            );
        },
    });
};
