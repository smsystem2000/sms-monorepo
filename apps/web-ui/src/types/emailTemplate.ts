export type TemplateType =
    | 'welcome'
    | 'announcement'
    | 'student_absent'
    | 'parent_teacher_meeting'
    | 'leave_approval'
    | 'leave_rejection'
    | 'exam_results'
    | 'fee_reminder'
    | 'custom';

export type PlaceholderCategory = 'school' | 'student' | 'parent' | 'teacher' | 'custom';

export interface Placeholder {
    key: string;
    label: string;
    category: PlaceholderCategory;
}

export interface EmailTemplate {
    _id: string;
    schoolId: string;
    templateName: string;
    templateType: TemplateType;
    subject: string;
    htmlContent: string;
    bannerImage?: string;
    styleTemplate: 'modern' | 'classic' | 'professional' | 'vibrant' | 'minimal';
    placeholders: Placeholder[];
    isActive: boolean;
    isDefault: boolean;
    version: number;
    createdBy: {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
    };
    updatedBy?: {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface TemplateTypeOption {
    value: TemplateType;
    label: string;
}

export interface CreateEmailTemplateInput {
    templateName: string;
    templateType: TemplateType;
    subject: string;
    htmlContent: string;
    bannerImage?: string;
    styleTemplate?: 'modern' | 'classic' | 'professional' | 'vibrant' | 'minimal';
    placeholders?: Placeholder[];
    isDefault?: boolean;
}

export interface UpdateEmailTemplateInput {
    templateName?: string;
    templateType?: TemplateType;
    subject?: string;
    htmlContent?: string;
    bannerImage?: string;
    styleTemplate?: 'modern' | 'classic' | 'professional' | 'vibrant' | 'minimal';
    placeholders?: Placeholder[];
    isActive?: boolean;
    isDefault?: boolean;
}

export interface PlaceholdersByCategory {
    school?: Placeholder[];
    student?: Placeholder[];
    parent?: Placeholder[];
    teacher?: Placeholder[];
    custom?: Placeholder[];
}

export interface PreviewTemplateInput {
    subject?: string;
    htmlContent?: string;
    bannerImage?: string;
    styleTemplate?: 'modern' | 'classic' | 'professional' | 'vibrant' | 'minimal';
    sampleData?: Record<string, any>;
}

export interface PreviewTemplateResult {
    subject: string;
    html: string;
    bannerImage?: string;
}

export interface EmailTemplatesResponse {
    templates: EmailTemplate[];
    count: number;
}

export interface EmailTemplateResponse {
    template: EmailTemplate;
}

export interface TemplateTypesResponse {
    types: TemplateTypeOption[];
}

export interface PlaceholdersResponse {
    placeholders: PlaceholdersByCategory;
}
