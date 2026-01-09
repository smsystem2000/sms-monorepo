import React from 'react';
import {
    Document,
    Page,
    View,
    Text,
} from '@react-pdf/renderer';
import { pdfStyles, getStatusStyle } from './shared/PDFStyles';
import PDFHeader from './shared/PDFHeader';
import { PageNumber } from './shared/PDFFooter';
import type { AttendanceSimple, AttendanceSummary } from '../../types';

interface AttendanceReportPDFProps {
    data: AttendanceSimple[];
    date: string;
    summary?: AttendanceSummary;
    schoolName?: string;
    schoolLogo?: string;
    reportType?: 'daily' | 'student_history';
    studentName?: string;
}

// Column widths as percentages
const columnWidths = {
    num: '8%',
    id: '20%',
    name: '30%',
    status: '15%',
    date: '15%',
    remarks: '12%',
};

const AttendanceReportPDF: React.FC<AttendanceReportPDFProps> = ({
    data,
    date,
    summary,
    schoolName,
    schoolLogo,
    reportType = 'daily',
    studentName,
}) => {
    const reportTitle = reportType === 'student_history'
        ? `Attendance History - ${studentName || 'Student'}`
        : 'Daily Attendance Report';

    return (
        <Document>
            <Page size="A4" style={pdfStyles.page}>
                {/* Header */}
                <PDFHeader
                    schoolName={schoolName}
                    schoolLogo={schoolLogo}
                    reportTitle={reportTitle}
                    reportDate={date}
                />

                {/* Table */}
                <View style={pdfStyles.table}>
                    {/* Table Header */}
                    <View style={pdfStyles.tableHeader}>
                        <Text style={[pdfStyles.tableHeaderCell, { width: columnWidths.num }]}>#</Text>
                        {reportType === 'daily' ? (
                            <>
                                <Text style={[pdfStyles.tableHeaderCell, { width: columnWidths.id }]}>Student ID</Text>
                                <Text style={[pdfStyles.tableHeaderCell, { width: columnWidths.name }]}>Name</Text>
                            </>
                        ) : (
                            <Text style={[pdfStyles.tableHeaderCell, { width: '35%' }]}>Date</Text>
                        )}
                        <Text style={[pdfStyles.tableHeaderCell, { width: columnWidths.status }]}>Status</Text>
                        <Text style={[pdfStyles.tableHeaderCell, { width: '27%' }]}>Remarks</Text>
                    </View>

                    {/* Table Body */}
                    {data.map((record, index) => (
                        <View
                            key={record.attendanceId || index}
                            style={index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt}
                        >
                            <Text style={[pdfStyles.tableCell, { width: columnWidths.num }]}>
                                {index + 1}
                            </Text>
                            {reportType === 'daily' ? (
                                <>
                                    <Text style={[pdfStyles.tableCell, { width: columnWidths.id }]}>
                                        {record.studentId || '-'}
                                    </Text>
                                    <Text style={[pdfStyles.tableCell, { width: columnWidths.name, textAlign: 'left' }]}>
                                        {(record as unknown as { studentName?: string }).studentName || record.studentId || '-'}
                                    </Text>
                                </>
                            ) : (
                                <Text style={[pdfStyles.tableCell, { width: '35%' }]}>
                                    {new Date(record.date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </Text>
                            )}
                            <View style={[pdfStyles.tableCell, { width: columnWidths.status }]}>
                                <Text style={getStatusStyle(record.status)}>
                                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                </Text>
                            </View>
                            <Text style={[pdfStyles.tableCell, { width: '27%', textAlign: 'left' }]}>
                                {record.remarks || '-'}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Summary */}
                {summary && (
                    <View style={pdfStyles.summary}>
                        <Text style={pdfStyles.summaryTitle}>Summary</Text>
                        <View style={pdfStyles.summaryRow}>
                            <Text style={pdfStyles.summaryLabel}>Total Records:</Text>
                            <Text style={pdfStyles.summaryValue}>{summary.total || data.length}</Text>
                        </View>
                        <View style={pdfStyles.summaryRow}>
                            <Text style={pdfStyles.summaryLabel}>Present:</Text>
                            <Text style={[pdfStyles.summaryValue, { color: '#4CAF50' }]}>{summary.present || 0}</Text>
                        </View>
                        <View style={pdfStyles.summaryRow}>
                            <Text style={pdfStyles.summaryLabel}>Absent:</Text>
                            <Text style={[pdfStyles.summaryValue, { color: '#F44336' }]}>{summary.absent || 0}</Text>
                        </View>
                        <View style={pdfStyles.summaryRow}>
                            <Text style={pdfStyles.summaryLabel}>Late:</Text>
                            <Text style={[pdfStyles.summaryValue, { color: '#FF9800' }]}>{summary.late || 0}</Text>
                        </View>
                        <View style={pdfStyles.summaryRow}>
                            <Text style={pdfStyles.summaryLabel}>Attendance Rate:</Text>
                            <Text style={pdfStyles.summaryValue}>
                                {(((summary.present || 0) + (summary.late || 0)) / (summary.total || 1) * 100).toFixed(1)}%
                            </Text>
                        </View>
                    </View>
                )}

                {/* Footer with page number */}
                <View style={pdfStyles.footer}>
                    <Text style={pdfStyles.footerText}>
                        Generated by School Management System
                    </Text>
                    <PageNumber />
                </View>
            </Page>
        </Document>
    );
};

export default AttendanceReportPDF;
