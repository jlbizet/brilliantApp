const nodemailer = require('nodemailer');
require('dotenv').config({ path: '../.env' });

console.log("Testing SMTP to: ", process.env.SMTP_HOST, process.env.SMTP_PORT);
console.log("Using User: ", process.env.SMTP_USER);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.SMTP_USER, // sending it to yourself
    subject: 'Test Email from Brilliant Dental CRM Backend',
    text: 'If you are reading this, nodemailer is working correctly natively.'
}).then(info => console.log('Successfully Sent! Message ID:', info.messageId)).catch(err => console.error('Error occurred:', err));
