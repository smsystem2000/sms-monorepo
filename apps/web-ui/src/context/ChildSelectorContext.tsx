import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { useGetMyChildren } from '../queries/ParentPortal';
import TokenService from '../queries/token/tokenService';
import type { Student } from '../types';

interface ChildSelectorContextType {
    selectedChild: (Student & { className?: string; sectionName?: string }) | null;
    setSelectedChild: (child: Student & { className?: string; sectionName?: string }) => void;
    children: (Student & { className?: string; sectionName?: string })[];
    isLoading: boolean;
    error: Error | null;
}

const ChildSelectorContext = createContext<ChildSelectorContextType | undefined>(undefined);

const STORAGE_KEY = 'sms_selected_child';

interface ChildSelectorProviderProps {
    children: ReactNode;
}

export const ChildSelectorProvider: React.FC<ChildSelectorProviderProps> = ({ children }) => {
    const schoolId = TokenService.getSchoolId() || '';
    const { data, isLoading, error } = useGetMyChildren(schoolId);

    const [selectedChild, setSelectedChildState] = useState<(Student & { className?: string; sectionName?: string }) | null>(null);

    // Get children from API response
    const childrenList = useMemo(() => {
        if (data?.data) {
            return data.data;
        }
        return [];
    }, [data]);

    // Initialize selected child from localStorage or first child
    useEffect(() => {
        if (childrenList.length > 0 && !selectedChild) {
            // Try to restore from localStorage
            const storedChildId = localStorage.getItem(STORAGE_KEY);
            if (storedChildId) {
                const found = childrenList.find(c => c.studentId === storedChildId);
                if (found) {
                    setSelectedChildState(found);
                    return;
                }
            }
            // Default to first child
            setSelectedChildState(childrenList[0]);
        }
    }, [childrenList, selectedChild]);

    const setSelectedChild = (child: Student & { className?: string; sectionName?: string }) => {
        setSelectedChildState(child);
        localStorage.setItem(STORAGE_KEY, child.studentId);
    };

    const value = useMemo(() => ({
        selectedChild,
        setSelectedChild,
        children: childrenList,
        isLoading,
        error: error as Error | null,
    }), [selectedChild, childrenList, isLoading, error]);

    return (
        <ChildSelectorContext.Provider value={value}>
            {children}
        </ChildSelectorContext.Provider>
    );
};

export const useChildSelector = (): ChildSelectorContextType => {
    const context = useContext(ChildSelectorContext);
    if (context === undefined) {
        throw new Error('useChildSelector must be used within a ChildSelectorProvider');
    }
    return context;
};

export default ChildSelectorContext;
