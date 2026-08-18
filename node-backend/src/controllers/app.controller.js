const transporter = require('../config/mail.config');
const { buildPayslipEmailHtml } = require('../templates/payslip-email');

// SAVE — no database, just handling/printing the data.
// Kept for parity with the fresher guide; not currently wired to a button,
// but ready if you need a generic "save" endpoint later.
exports.saveData = (req, res) => {
  try {
    const data = req.body;
    console.log('Data received to save:', data);
    res.status(200).json({
      success: true,
      message: 'Data saved successfully (no DB used, just processed)',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// SEND MAIL — replaces EmailJS.
// Accepts either:
//   { to, subject, message }                -> plain text email
//   { to, subject, payslip: { ...fields } }  -> rendered payslip HTML email
// Optionally: { pdfBase64, pdfFileName } to attach a PDF (e.g. from jsPDF on the client).
exports.sendMail = async (req, res) => {
  try {
    const { to, subject, message, payslip, pdfBase64, pdfFileName } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: 'to and subject are required',
      });
    }
    if (!message && !payslip) {
      return res.status(400).json({
        success: false,
        message: 'Either message (plain text) or payslip (structured data) is required',
      });
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'HRMS'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
    };

    if (payslip) {
      mailOptions.html = buildPayslipEmailHtml(payslip);
      mailOptions.text = `Hi ${payslip.to_name || ''}, your payslip for ${payslip.pay_period || ''} is ready. Net pay: Rs. ${payslip.net_pay || ''}. ${payslip.payslip_link ? 'View it here: ' + payslip.payslip_link : ''}`;
    } else {
      mailOptions.text = message;
    }

    if (pdfBase64) {
      mailOptions.attachments = [
        {
          filename: pdfFileName || 'payslip.pdf',
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf',
        },
      ];
    }

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'Mail sent successfully' });
  } catch (error) {
    console.error('sendMail error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
