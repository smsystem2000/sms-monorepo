import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { AttendanceSimple, MonthlyReport } from '../../types';

// Style configuration
const styles = {
    headerFill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF1976D2' }, // Primary blue
    },
    headerFont: {
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 12,
    },
    statusColors: {
        present: { argb: 'FF4CAF50' }, // Green
        absent: { argb: 'FFF44336' }, // Red
        late: { argb: 'FFFF9800' }, // Orange
        half_day: { argb: 'FF2196F3' }, // Blue
        leave: { argb: 'FF9E9E9E' }, // Grey
    },
    borderThin: {
        top: { style: 'thin' as const, color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin' as const, color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin' as const, color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin' as const, color: { argb: 'FFD0D0D0' } },
    },
};

// Apply header style to a row
const applyHeaderStyle = (row: ExcelJS.Row) => {
    row.eachCell((cell) => {
        cell.fill = styles.headerFill;
        cell.font = styles.headerFont;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = styles.borderThin;
    });
    row.height = 25;
};

// Apply cell border and alignment
const applyCellStyle = (cell: ExcelJS.Cell, status?: string) => {
    cell.border = styles.borderThin;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };

    if (status && styles.statusColors[status as keyof typeof styles.statusColors]) {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: styles.statusColors[status as keyof typeof styles.statusColors],
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    }
};

// Auto-fit column width
const autoFitColumns = (worksheet: ExcelJS.Worksheet) => {
    worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength;
            }
        });
        column.width = Math.min(Math.max(maxLength + 2, 12), 40);
    });
};

/**
 * Export daily attendance to Excel
 */
export const exportDailyAttendance = async (
    data: AttendanceSimple[],
    date: string,
    fileName?: string
) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'School Management System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Daily Attendance');

    // Title row
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Daily Attendance Report - ${new Date(date).toLocaleDateString()}`;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // Empty row
    worksheet.addRow([]);

    // Headers
    const headerRow = worksheet.addRow(['#', 'Student ID', 'Student Name', 'Class', 'Status', 'Remarks']);
    applyHeaderStyle(headerRow);

    // Data rows
    data.forEach((record, index) => {
        const row = worksheet.addRow([
            index + 1,
            record.studentId || '',
            (record as unknown as { studentName?: string }).studentName || record.studentId || '',
            (record as unknown as { className?: string }).className || '',
            record.status.charAt(0).toUpperCase() + record.status.slice(1),
            record.remarks || '-',
        ]);

        row.eachCell((cell, colNumber) => {
            applyCellStyle(cell, colNumber === 5 ? record.status : undefined);
        });
    });

    // Summary
    worksheet.addRow([]);
    const present = data.filter((r) => r.status === 'present').length;
    const absent = data.filter((r) => r.status === 'absent').length;
    const late = data.filter((r) => r.status === 'late').length;

    worksheet.addRow(['Summary']).font = { bold: true };
    worksheet.addRow(['Total Students', data.length]);
    worksheet.addRow(['Present', present]);
    worksheet.addRow(['Absent', absent]);
    worksheet.addRow(['Late', late]);
    worksheet.addRow(['Attendance %', `${((present + late) / data.length * 100).toFixed(1)}%`]);

    autoFitColumns(worksheet);

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName || `attendance_${date}.xlsx`);
};

/**
 * Export monthly attendance report to Excel
 */
export const exportMonthlyAttendance = async (
    data: MonthlyReport,
    fileName?: string
) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'School Management System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Monthly Report');

    // Title
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Monthly Attendance Report - ${data.month}/${data.year}`;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    worksheet.addRow([]);

    // Student data
    if (data.students) {
        const headerRow = worksheet.addRow([
            '#', 'Student ID', 'Class', 'Present', 'Absent', 'Late', 'Leave', 'Total', 'Percentage'
        ]);
        applyHeaderStyle(headerRow);

        data.students.byStudent.forEach((student, index) => {
            const row = worksheet.addRow([
                index + 1,
                student.studentId,
                student.classId || '-',
                student.present || 0,
                student.absent || 0,
                student.late || 0,
                student.leave || 0,
                student.total || 0,
                `${student.percentage || 0}%`,
            ]);

            row.eachCell((cell, colNumber) => {
                applyCellStyle(cell);
                // Color the percentage cell based on value
                if (colNumber === 9) {
                    const pct = parseFloat(student.percentage || '0');
                    if (pct >= 75) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } };
                        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                    } else if (pct >= 50) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9800' } };
                        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                    } else {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF44336' } };
                        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                    }
                }
            });
        });
    }

    autoFitColumns(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName || `monthly_report_${data.month}_${data.year}.xlsx`);
};

/**
 * Export general data to Excel with custom columns
 */
export const exportToExcel = async <T extends Record<string, unknown>>(
    data: T[],
    columns: { header: string; key: keyof T; statusField?: boolean }[],
    title: string,
    fileName: string
) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'School Management System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Report');

    // Title
    const colCount = columns.length;
    worksheet.mergeCells(1, 1, 1, colCount);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    worksheet.addRow([]);

    // Headers
    const headerRow = worksheet.addRow(['#', ...columns.map((c) => c.header)]);
    applyHeaderStyle(headerRow);

    // Data
    data.forEach((item, index) => {
        const rowData = [index + 1, ...columns.map((c) => item[c.key] ?? '-')];
        const row = worksheet.addRow(rowData);

        row.eachCell((cell, colNumber) => {
            const col = columns[colNumber - 2]; // -1 for # column, -1 for 1-indexed
            if (col?.statusField && typeof item[col.key] === 'string') {
                applyCellStyle(cell, item[col.key] as string);
            } else {
                applyCellStyle(cell);
            }
        });
    });

    autoFitColumns(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
};
