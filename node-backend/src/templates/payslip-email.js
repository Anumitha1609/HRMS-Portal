/**
 * Builds the HTML body for a payslip notification email.
 * Mirrors the fields the Angular app used to send to the EmailJS template
 * in salary-generation.component.ts (to_name, emp_code, pay_period, basic,
 * hra, net_pay, payslip_link, etc.) — same data, rendered here instead.
 */
function buildPayslipEmailHtml(data) {
  const {
    to_name, emp_code, designation, department, location, doj,
    bank_name, bank_account_no, pan_number,
    pay_period, pay_date,
    basic, hra, conveyance, other_allowance, total_earnings,
    pf, professional_tax, income_tax, total_deductions,
    net_pay,
    company_name, company_address,
    payslip_link,
  } = data;

  const row = (label, value) => `
    <tr>
      <td style="padding:4px 12px;color:#555;font-size:13px;">${label}</td>
      <td style="padding:4px 12px;color:#111;font-size:13px;text-align:right;">${value}</td>
    </tr>`;

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#222;">
    <div style="background:#1f2937;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
      <h2 style="margin:0;font-size:18px;">${company_name || 'Payslip Notification'}</h2>
      <p style="margin:4px 0 0;font-size:12px;color:#cbd5e1;white-space:pre-line;">${company_address || ''}</p>
    </div>

    <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
      <p style="font-size:14px;">Hi ${to_name || 'there'},</p>
      <p style="font-size:14px;">
        Your payslip for <strong>${pay_period || ''}</strong> has been generated.
        Here is a summary:
      </p>

      <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafb;border-radius:6px;overflow:hidden;">
        ${row('Employee Code', emp_code)}
        ${row('Designation', designation)}
        ${row('Department', department)}
        ${row('Location', location)}
        ${row('Date of Joining', doj)}
        ${row('Bank', `${bank_name || ''} (${bank_account_no || ''})`)}
        ${row('PAN', pan_number)}
        ${row('Pay Date', pay_date)}
      </table>

      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td colspan="2" style="padding:6px 12px;font-weight:bold;font-size:13px;background:#eef2ff;">Earnings</td></tr>
        ${row('Basic', `₹ ${basic}`)}
        ${row('HRA', `₹ ${hra}`)}
        ${row('Conveyance', `₹ ${conveyance}`)}
        ${row('Other Allowance', `₹ ${other_allowance}`)}
        ${row('Total Earnings', `₹ ${total_earnings}`)}

        <tr><td colspan="2" style="padding:6px 12px;font-weight:bold;font-size:13px;background:#fef2f2;">Deductions</td></tr>
        ${row('PF', `₹ ${pf}`)}
        ${row('Professional Tax', `₹ ${professional_tax}`)}
        ${row('Income Tax', `₹ ${income_tax}`)}
        ${row('Total Deductions', `₹ ${total_deductions}`)}
      </table>

      <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#ecfdf5;border-radius:6px;">
        ${row('<strong>Net Pay</strong>', `<strong>₹ ${net_pay}</strong>`)}
      </table>

      ${payslip_link ? `
      <div style="text-align:center;margin:24px 0 8px;">
        <a href="${payslip_link}"
           style="background:#2563eb;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;display:inline-block;">
          View / Download Full Payslip
        </a>
      </div>
      <p style="font-size:11px;color:#888;text-align:center;">
        If the button doesn't work, copy and paste this link:<br>${payslip_link}
      </p>` : ''}

      <p style="font-size:12px;color:#888;margin-top:24px;">
        This is an automated email from ${company_name || 'HR'}. Please do not reply directly to this message.
      </p>
    </div>
  </div>`;
}

module.exports = { buildPayslipEmailHtml };
