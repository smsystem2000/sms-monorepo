import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfStyles } from './PDFStyles';

interface PDFFooterProps {
    pageNumber?: number;
    totalPages?: number;
}

const PDFFooter: React.FC<PDFFooterProps> = ({
    pageNumber,
    totalPages,
}) => {
    const now = new Date().toLocaleString();

    return (
        <View style={pdfStyles.footer} fixed>
            <Text style={pdfStyles.footerText}>
                School Management System | {now}
            </Text>
            {pageNumber && totalPages && (
                <Text style={pdfStyles.pageNumber}>
                    Page {pageNumber} of {totalPages}
                </Text>
            )}
        </View>
    );
};

// Page number component for dynamic rendering
export const PageNumber: React.FC = () => (
    <Text
        style={pdfStyles.pageNumber}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        fixed
    />
);

export default PDFFooter;
