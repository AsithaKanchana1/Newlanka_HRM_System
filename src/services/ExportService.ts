/**
 * Export Service
 * Handles data export to Excel, PDF, and CSV formats
 */

import type { Employee } from "../types/employee";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

// Re-export for convenience
export type ExportFormat = 'excel' | 'csv' | 'pdf';

// Excel export configuration
interface ExcelColumn {
  header: string;
  key: keyof Employee;
  width?: number;
}

// Default columns for employee export
const DEFAULT_EMPLOYEE_COLUMNS: ExcelColumn[] = [
  { header: "EPF Number", key: "epf_number", width: 12 },
  { header: "Name with Initials", key: "name_with_initials", width: 25 },
  { header: "Full Name", key: "full_name", width: 35 },
  { header: "Department", key: "department", width: 15 },
  { header: "Cader", key: "cader", width: 12 },
  { header: "Designation", key: "designation", width: 20 },
  { header: "Allocation", key: "allocation", width: 15 },
  { header: "Date of Joining", key: "date_of_join", width: 15 },
  { header: "Working Status", key: "working_status", width: 12 },
  { header: "Date of Birth", key: "dob", width: 15 },
  { header: "Marital Status", key: "marital_status", width: 12 },
  { header: "Mobile 1", key: "mobile_1", width: 15 },
  { header: "Mobile 2", key: "mobile_2", width: 15 },
  { header: "Transport Route", key: "transport_route", width: 15 },
  { header: "Police Area", key: "police_area", width: 15 },
  { header: "Address", key: "address", width: 40 },
  { header: "Date of Resignation", key: "date_of_resign", width: 15 },
];

export class ExportService {
  /**
   * Export employees to Excel format
   */
  static async exportToExcel(
    employees: Employee[],
    filename: string = "employees",
    columns: ExcelColumn[] = DEFAULT_EMPLOYEE_COLUMNS
  ): Promise<void> {
    try {
      // Create workbook data
      const worksheetData = this.createWorksheetData(employees, columns);
      
      // Generate Excel XML content
      const xmlContent = this.generateExcelXML(worksheetData, columns);
      
      // Use Tauri dialog to save file
      const filePath = await save({
        defaultPath: `${filename}_${this.getTimestamp()}.xlsx`,
        filters: [{ name: "Excel Files", extensions: ["xlsx", "xls"] }],
      });
      
      if (filePath) {
        await writeTextFile(filePath, xmlContent);
      }
    } catch (error) {
      console.error("ExportService.exportToExcel error:", error);
      throw new Error(`Failed to export to Excel: ${error}`);
    }
  }

  /**
   * Export employees to CSV format
   */
  static async exportToCSV(
    employees: Employee[],
    filename: string = "employees",
    columns: ExcelColumn[] = DEFAULT_EMPLOYEE_COLUMNS
  ): Promise<void> {
    try {
      const csvContent = this.generateCSV(employees, columns);
      
      // Use Tauri dialog to save file
      const filePath = await save({
        defaultPath: `${filename}_${this.getTimestamp()}.csv`,
        filters: [{ name: "CSV Files", extensions: ["csv"] }],
      });
      
      if (filePath) {
        await writeTextFile(filePath, csvContent);
      }
    } catch (error) {
      console.error("ExportService.exportToCSV error:", error);
      throw new Error(`Failed to export to CSV: ${error}`);
    }
  }

  /**
   * Export employees to printable PDF (saves HTML for printing)
   */
  static async exportToPDF(
    employees: Employee[],
    title: string = "Employee Report"
  ): Promise<void> {
    try {
      const htmlContent = this.generatePDFHTML(employees, title);
      
      // Use Tauri dialog to save HTML file
      const filePath = await save({
        defaultPath: `${title.replace(/\s+/g, '_')}_${this.getTimestamp()}.html`,
        filters: [{ name: "HTML Files", extensions: ["html"] }],
      });
      
      if (filePath) {
        await writeTextFile(filePath, htmlContent);
        // Open the file in browser for printing
        const { open } = await import("@tauri-apps/plugin-shell");
        await open(filePath);
      }
    } catch (error) {
      console.error("ExportService.exportToPDF error:", error);
      throw new Error(`Failed to export to PDF: ${error}`);
    }
  }

  /**
   * Create worksheet data from employees
   */
  private static createWorksheetData(
    employees: Employee[],
    columns: ExcelColumn[]
  ): string[][] {
    const headers = columns.map(col => col.header);
    const rows = employees.map(emp =>
      columns.map(col => this.formatCellValue(emp[col.key]))
    );
    return [headers, ...rows];
  }

  /**
   * Generate Excel XML content
   */
  private static generateExcelXML(
    data: string[][],
    columns: ExcelColumn[]
  ): string {
    // Using XML Spreadsheet format for better Excel compatibility
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<?mso-application progid="Excel.Sheet"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xml += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xml += '  <Styles>\n';
    xml += '    <Style ss:ID="header">\n';
    xml += '      <Font ss:Bold="1" ss:Color="#FFFFFF"/>\n';
    xml += '      <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>\n';
    xml += '      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n';
    xml += '    </Style>\n';
    xml += '    <Style ss:ID="data">\n';
    xml += '      <Alignment ss:Vertical="Center"/>\n';
    xml += '    </Style>\n';
    xml += '    <Style ss:ID="active">\n';
    xml += '      <Font ss:Color="#166534"/>\n';
    xml += '      <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>\n';
    xml += '    </Style>\n';
    xml += '    <Style ss:ID="resigned">\n';
    xml += '      <Font ss:Color="#991B1B"/>\n';
    xml += '      <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>\n';
    xml += '    </Style>\n';
    xml += '  </Styles>\n';
    xml += '  <Worksheet ss:Name="Employees">\n';
    xml += '    <Table>\n';

    // Column widths
    columns.forEach(col => {
      xml += `      <Column ss:Width="${(col.width || 15) * 7}"/>\n`;
    });

    // Data rows
    data.forEach((row, rowIndex) => {
      xml += '      <Row>\n';
      row.forEach((cell, cellIndex) => {
        let styleId = rowIndex === 0 ? 'header' : 'data';
        
        // Apply status styling
        if (rowIndex > 0 && columns[cellIndex]?.key === 'working_status') {
          styleId = cell.toLowerCase() === 'active' ? 'active' : 'resigned';
        }
        
        const escapedCell = this.escapeXml(cell);
        xml += `        <Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapedCell}</Data></Cell>\n`;
      });
      xml += '      </Row>\n';
    });

    xml += '    </Table>\n';
    xml += '  </Worksheet>\n';
    xml += '</Workbook>';

    return xml;
  }

  /**
   * Generate CSV content
   */
  private static generateCSV(
    employees: Employee[],
    columns: ExcelColumn[]
  ): string {
    const headers = columns.map(col => `"${col.header}"`).join(",");
    const rows = employees.map(emp =>
      columns.map(col => `"${this.formatCellValue(emp[col.key]).replace(/"/g, '""')}"`).join(",")
    );
    return [headers, ...rows].join("\n");
  }

  /**
   * Generate printable HTML for PDF export
   */
  private static generatePDFHTML(employees: Employee[], title: string): string {
    const rows = employees.map(emp => `
      <tr>
        <td>${emp.epf_number}</td>
        <td>${emp.name_with_initials}</td>
        <td>${emp.department || '-'}</td>
        <td>${emp.designation || '-'}</td>
        <td>${emp.mobile_1 || '-'}</td>
        <td class="${emp.working_status === 'active' ? 'status-active' : 'status-resigned'}">
          ${emp.working_status === 'active' ? 'Active' : 'Resigned'}
        </td>
      </tr>
    `).join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 15px; }
          .header h1 { color: #1e40af; font-size: 24px; }
          .header p { color: #6b7280; font-size: 14px; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #2563eb; color: white; padding: 10px 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
          tr:hover { background: #f9fafb; }
          .status-active { color: #166534; background: #dcfce7; padding: 2px 8px; border-radius: 10px; }
          .status-resigned { color: #991b1b; background: #fee2e2; padding: 2px 8px; border-radius: 10px; }
          .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #9ca3af; }
          @media print {
            .no-print { display: none; }
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>New Lanka Clothing (Pvt) Ltd</h1>
          <p>${title} - Generated on ${new Date().toLocaleDateString('en-GB', { 
            day: '2-digit', month: 'long', year: 'numeric' 
          })}</p>
          <p>Total Records: ${employees.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>EPF No.</th>
              <th>Name</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Mobile</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="footer">
          <p>HRM System - New Lanka Clothing (Pvt) Ltd</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Format cell value for export
   */
  private static formatCellValue(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") {
      // Format status values
      if (value === "active") return "Active";
      if (value === "resign") return "Resigned";
      return value;
    }
    return String(value);
  }

  /**
   * Escape XML special characters
   */
  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * Get timestamp for filename
   */
  private static getTimestamp(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  }
}
