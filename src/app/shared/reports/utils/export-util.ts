export class ExportUtil {
  private static readonly currencyFields = [
    'rate',
    'gross',
    'deductions',
    'net',
    'earnings',
    'netValue',
    'salary',
    'bonus',
    'incentives',
    'insurance',
    'total',
    'advanceAmount',
    'recoveryAmount',
    'balance',
    'amount',
    'eligibleAmt',
    'approvedAmt',
    'prevSalary',
    'revSalary',
    'incrementAmount',
    'revisionAmount',
    'propSalary'
  ];

  private static readonly percentageFields = [
    'incPercent',
    'incrementPercent',
    'incPercentCumulative'
  ];

  private static readonly numericFields = [
    'actual',
    'ot',
    'days',
    'delay',
    'working',
    'break',
    'years',
    'months',
    'basic',
    'da'
  ];

  static exportToCSV(headers: { field: string, label: string }[], data: any[], filename: string) {
    const csvRows = [
      headers.map(h => this.csvEscape(h.label)).join(',')
    ];

    for (const row of data) {
      const values = headers.map(h => this.csvEscape(this.formatValue(row[h.field], h.field)));
      csvRows.push(values.join(','));
    }

    const blob = new Blob(['\uFEFF', csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `${this.sanitizeFilename(filename)}.csv`);
  }

  static exportToExcel(headers: { field: string, label: string }[], data: any[], filename: string) {
    const worksheetName = this.xmlEscape(this.sanitizeWorksheetName(filename));
    const rows = [
      this.excelRow(headers.map(h => ({ value: h.label, type: 'String' as const, styleId: 'Header' }))),
      ...data.map(row => this.excelRow(headers.map(h => this.excelCell(row[h.field], h.field))))
    ].join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="Cell">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="${worksheetName}">
  <Table>
${rows}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
   <ActivePane>2</ActivePane>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

    const blob = new Blob(['\uFEFF', xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    this.downloadBlob(blob, `${this.sanitizeFilename(filename)}.xls`);
  }

  static exportToPDF(filename: string) {
    const originalTitle = document.title;
    document.title = filename.replace(/_/g, ' ');
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }

  private static excelCell(value: any, field: string): { value: string; type: 'String' | 'Number'; styleId: string } {
    if (value === undefined || value === null || value === '') {
      return { value: '', type: 'String', styleId: 'Cell' };
    }

    if (typeof value === 'number' && (this.numericFields.includes(field) || (!this.currencyFields.includes(field) && !this.percentageFields.includes(field)))) {
      return { value: String(value), type: 'Number', styleId: 'Cell' };
    }

    return { value: this.formatValue(value, field), type: 'String', styleId: 'Cell' };
  }

  private static excelRow(cells: { value: string; type: 'String' | 'Number'; styleId: string }[]): string {
    const cellXml = cells.map(cell => {
      const value = cell.type === 'Number' ? cell.value : this.xmlEscape(cell.value);
      return `   <Cell ss:StyleID="${cell.styleId}"><Data ss:Type="${cell.type}">${value}</Data></Cell>`;
    }).join('');

    return `  <Row>${cellXml}</Row>`;
  }

  private static formatValue(value: any, field: string): string {
    if (value === undefined || value === null) return '';

    if (typeof value === 'number' && this.currencyFields.includes(field)) {
      return 'Rs. ' + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    if (typeof value === 'number' && this.percentageFields.includes(field)) {
      return value.toFixed(1) + '%';
    }

    return String(value);
  }

  private static csvEscape(value: string): string {
    return `"${String(value).replace(/"/g, '""')}"`;
  }

  private static xmlEscape(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private static sanitizeFilename(filename: string): string {
    return String(filename || 'report')
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\s+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 120) || 'report';
  }

  private static sanitizeWorksheetName(name: string): string {
    const cleaned = String(name || 'Report')
      .replace(/[\[\]:*?/\\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return (cleaned || 'Report').slice(0, 31);
  }

  private static downloadBlob(blob: Blob, filename: string) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
