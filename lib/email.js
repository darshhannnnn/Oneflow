const nodemailer = require('nodemailer');

/**
 * Create email transporter with Gmail credentials
 * Using Gmail service with direct credentials (no .env dependency)
 */
function createTransporter() {
  // Gmail configuration with direct credentials
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'jenithjain09@gmail.com',
      pass: 'hpew wnra hbin zvhz'  // Gmail App Password
    }
  });

  return transporter;
}

/**
 * Send invoice email to customer
 */
async function sendInvoiceEmail({ 
  customerName, 
  customerEmail, 
  invoiceNumber, 
  invoiceDate, 
  dueDate, 
  lines, 
  subtotal, 
  taxTotal, 
  total,
  currency = 'INR'
}) {
  try {
    const transporter = createTransporter();

    // Create invoice line items HTML
    const itemsHtml = lines.map(line => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${line.description}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${Number(line.quantity)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${Number(line.unitPrice).toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${line.taxPercent || 0}%</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${Number(line.amount).toFixed(2)}</td>
      </tr>
    `).join('');

    // Create HTML email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .invoice-box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 10px 0; }
          .total { font-size: 24px; color: #4F46E5; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
          .button { background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 OneFlow</h1>
            <h2>Invoice from OneFlow</h2>
          </div>
          
          <div class="content">
            <div class="success-badge">✅ Invoice Created</div>
            
            <p>Dear <strong>${customerName}</strong>,</p>
            
            <p>Thank you for your business. Please find your invoice details below:</p>
            
            <div class="invoice-box">
              <h3>Invoice Details</h3>
              <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
              <p><strong>Invoice Date:</strong> ${new Date(invoiceDate).toLocaleDateString('en-IN')}</p>
              <p><strong>Due Date:</strong> ${dueDate ? new Date(dueDate).toLocaleDateString('en-IN') : 'N/A'}</p>
              <p><strong>Email:</strong> ${customerEmail}</p>
            </div>
            
            <div class="invoice-box">
              <h3>Invoice Items</h3>
              <table>
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 10px; text-align: left;">Description</th>
                    <th style="padding: 10px; text-align: center;">Qty</th>
                    <th style="padding: 10px; text-align: right;">Unit Price</th>
                    <th style="padding: 10px; text-align: center;">Tax %</th>
                    <th style="padding: 10px; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div style="text-align: right; padding: 20px 0; border-top: 2px solid #4F46E5;">
                <p style="font-size: 16px; margin: 5px 0;">Subtotal: ₹${Number(subtotal).toFixed(2)}</p>
                <p style="font-size: 16px; margin: 5px 0;">Tax: ₹${Number(taxTotal).toFixed(2)}</p>
                <p class="total">Total Amount: ₹${Number(total).toFixed(2)}</p>
              </div>
            </div>
            
            <div class="invoice-box" style="background: #ecfdf5; border-left: 4px solid #10b981;">
              <h3 style="color: #059669;">💳 Payment Instructions</h3>
              <ul>
                <li>Please make payment by the due date</li>
                <li>Payment can be made via bank transfer or online</li>
                <li>Quote invoice number: <strong>${invoiceNumber}</strong></li>
                <li>For any queries, contact us at sales@oneflow.com</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="http://localhost:3000/dashboard/invoices" class="button">View All Invoices</a>
            </div>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              If you have any questions about this invoice, please contact us at 
              <a href="mailto:sales@oneflow.com">sales@oneflow.com</a>
            </p>
          </div>
          
          <div class="footer">
            <p><strong>OneFlow</strong></p>
            <p>Your Business Management Solution</p>
            <p style="font-size: 12px; margin-top: 10px;">
              © 2025 OneFlow. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text version
    const textContent = `
Dear ${customerName},

Thank you for your business. Please find your invoice details below:

Invoice Number: ${invoiceNumber}
Invoice Date: ${new Date(invoiceDate).toLocaleDateString('en-IN')}
Due Date: ${dueDate ? new Date(dueDate).toLocaleDateString('en-IN') : 'N/A'}

Items:
${lines.map(line => 
  `- ${line.description}: ${line.quantity} x ₹${Number(line.unitPrice).toFixed(2)} = ₹${Number(line.amount).toFixed(2)}`
).join('\n')}

Subtotal: ₹${Number(subtotal).toFixed(2)}
Tax: ₹${Number(taxTotal).toFixed(2)}
Total Amount: ₹${Number(total).toFixed(2)}

Please make payment by the due date.

Best regards,
OneFlow Sales Team
sales@oneflow.com
    `;

    // Send email
    const mailOptions = {
      from: '"OneFlow Sales" <jenithjain09@gmail.com>',
      to: customerEmail,
      subject: `📋 Invoice ${invoiceNumber} from OneFlow`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ REAL EMAIL SENT SUCCESSFULLY!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Email sent to:', customerEmail);
    console.log('✉️ Customer should check their inbox!');
    
    return { 
      success: true, 
      messageId: info.messageId,
      recipient: customerEmail
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test email configuration
 */
async function testEmailConfig() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✓ Email server is ready to send emails');
    return true;
  } catch (error) {
    console.error('✗ Email configuration error:', error);
    return false;
  }
}

module.exports = { sendInvoiceEmail, createTransporter, testEmailConfig };
