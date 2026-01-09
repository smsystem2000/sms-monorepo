import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles } from './PDFStyles';

interface PDFHeaderProps {
    schoolName?: string;
    schoolLogo?: string;
    reportTitle: string;
    reportDate?: string;
    dateRange?: { start: string; end: string };
}

const PDFHeader: React.FC<PDFHeaderProps> = ({
    schoolName = 'School Management System',
    schoolLogo,
    reportTitle,
    reportDate,
    dateRange,
}) => {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <View style={pdfStyles.header}>
            <View style={pdfStyles.headerLeft}>
                {schoolLogo && (
                    <Image src={schoolLogo} style={pdfStyles.logo} />
                )}
                <Text style={pdfStyles.schoolName}>{schoolName}</Text>
                <Text style={pdfStyles.reportTitle}>{reportTitle}</Text>
            </View>
            <View style={pdfStyles.headerRight}>
                <Text style={pdfStyles.dateText}>Generated: {today}</Text>
                {reportDate && (
                    <Text style={pdfStyles.dateText}>
                        Report Date: {new Date(reportDate).toLocaleDateString()}
                    </Text>
                )}
                {dateRange && (
                    <Text style={pdfStyles.dateText}>
                        Period: {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
                    </Text>
                )}
            </View>
        </View>
    );
};

export default PDFHeader;
