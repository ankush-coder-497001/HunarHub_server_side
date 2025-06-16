import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASSWORD
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5
})

const sendEmail = async (to, subject, text, html) => {
  try {
    await transporter.sendMail({
      from: process.env.ADMIN_EMAIL,
      to,
      subject,
      text,
      html
    });

  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export const WelcomeEmail = async (to, name) => {
  try {
    const subject = 'Welcome to LocalBliz';
    const text = `Hello ${name}, welcome to LocalBliz!`;
    const html = `<p>Hello ${name}, welcome to LocalBliz!</p>`;

    await sendEmail(to, subject, text, html);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}

export const SendOTP = async (to, otp) => {
  try {
    const subject = 'Your OTP Code';
    const text = `Your OTP code is ${otp}`;
    const html = `<p>Your OTP code is <strong>${otp}</strong></p>`;

    await sendEmail(to, subject, text, html);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
}

export const BookingRequestedEmail = async (to, bookingDetails) => {
  try {
    const { name, service, date, time, location, customerNotes } = bookingDetails;

    const subject = 'Booking Requested - LocalBliz';

    const text = `A new booking request has been made.
Service: ${service}
Date: ${date}
Time: ${time}
Location: ${location}
Notes: ${customerNotes || 'N/A'}
    `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Booking Request - LocalBliz</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: auto;
              background-color: #ffffff;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background-color: #007BFF;
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
            }
            .content {
              padding: 20px 30px;
              color: #333;
            }
            .content h2 {
              margin-top: 0;
            }
            .details-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .details-table td {
              padding: 10px 0;
            }
            .details-table td.label {
              font-weight: bold;
              width: 150px;
            }
            .footer {
              background-color: #f1f1f1;
              text-align: center;
              padding: 15px;
              font-size: 14px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Request Received</h1>
              <p>Someone just requested a service via <strong>LocalBliz</strong></p>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Your booking request has been received. Here are the details:</p>

              <table class="details-table">
                <tr>
                  <td class="label">Service:</td>
                  <td>${service}</td>
                </tr>
                <tr>
                  <td class="label">Date:</td>
                  <td>${date}</td>
                </tr>
                <tr>
                  <td class="label">Time:</td>
                  <td>${time}</td>
                </tr>
                <tr>
                  <td class="label">Location:</td>
                  <td>${location}</td>
                </tr>
                <tr>
                  <td class="label">Notes:</td>
                  <td>${customerNotes || 'N/A'}</td>
                </tr>
              </table>

              <p>Our team will confirm your booking shortly. Please stay tuned for an update.</p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} LocalBliz. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(to, subject, text, html);
  } catch (error) {
    console.error('Error sending booking requested email:', error);
    throw error;
  }
};

export const BookingConfirmationEmail = async (to, bookingDetails) => {
  try {
    const { name, service, date, time, location, customerNotes } = bookingDetails;

    const subject = 'Booking Confirmation - LocalBliz';

    const text = `Your booking with LocalBliz is confirmed.
Service: ${service}
Date: ${date}
Time: ${time}
Location: ${location}
Notes: ${customerNotes || 'N/A'}
    `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Booking Confirmation - LocalBliz</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: auto;
              background-color: #ffffff;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background-color: #4CAF50;
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
            }
            .content {
              padding: 20px 30px;
              color: #333;
            }
            .content h2 {
              margin-top: 0;
            }
            .details-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .details-table td {
              padding: 10px 0;
            }
            .details-table td.label {
              font-weight: bold;
              width: 150px;
            }
            .footer {
              background-color: #f1f1f1;
              text-align: center;
              padding: 15px;
              font-size: 14px;
              color: #777;
            }
            .cta-button {
              display: inline-block;
              background-color: #4CAF50;
              color: white;
              padding: 12px 25px;
              border-radius: 5px;
              text-decoration: none;
              margin-top: 20px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed!</h1>
              <p>Thank you for choosing <strong>LocalBliz</strong></p>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Your booking has been successfully confirmed. Here are your booking details:</p>

              <table class="details-table">
                <tr>
                  <td class="label">Service:</td>
                  <td>${service}</td>
                </tr>
                <tr>
                  <td class="label">Date:</td>
                  <td>${date}</td>
                </tr>
                <tr>
                  <td class="label">Time:</td>
                  <td>${time}</td>
                </tr>
                <tr>
                  <td class="label">Location:</td>
                  <td>${location}</td>
                </tr>
                <tr>
                  <td class="label">Notes:</td>
                  <td>${customerNotes || 'N/A'}</td>
                </tr>
              </table>

              <p>If you have any questions or need to make changes, feel free to contact us anytime.</p>
              <a href="#" class="cta-button">Visit LocalBliz</a>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} LocalBliz. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(to, subject, text, html);
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    throw error;
  }
};

export const BookingCancellationEmail = async (to, bookingDetails) => {
  try {
    const { name, service, date, time, location, customerNotes } = bookingDetails;

    const subject = 'Booking Cancellation - LocalBliz';

    const text = `Your booking with LocalBliz has been cancelled.
Service: ${service}
Date: ${date}
Time: ${time}
Location: ${location}
Notes: ${customerNotes || 'N/A'}
    `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Booking Cancellation - LocalBliz</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: auto;
              background-color: #ffffff;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background-color: #d9534f;
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
            }
            .content {
              padding: 20px 30px;
              color: #333;
            }
            .content h2 {
              margin-top: 0;
            }
            .details-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .details-table td {
              padding: 10px 0;
            }
            .details-table td.label {
              font-weight: bold;
              width: 150px;
            }
            .footer {
              background-color: #f1f1f1;
              text-align: center;
              padding: 15px;
              font-size: 14px;
              color: #777;
            }
            .cta-button {
              display: inline-block;
              background-color: #4CAF50;
              color: white;
              padding: 12px 25px;
              border-radius: 5px;
              text-decoration: none;
              margin-top: 20px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Cancelled</h1>
              <p>Your booking with <strong>LocalBliz</strong> has been cancelled</p>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>We're sorry to inform you that your booking has been cancelled. Below are the details:</p>

              <table class="details-table">
                <tr>
                  <td class="label">Service:</td>
                  <td>${service}</td>
                </tr>
                <tr>
                  <td class="label">Date:</td>
                  <td>${date}</td>
                </tr>
                <tr>
                  <td class="label">Time:</td>
                  <td>${time}</td>
                </tr>
                <tr>
                  <td class="label">Location:</td>
                  <td>${location}</td>
                </tr>
                <tr>
                  <td class="label">Notes:</td>
                  <td>${customerNotes || 'N/A'}</td>
                </tr>
              </table>

              <p>If this was a mistake or you'd like to reschedule, please reach out to our support team.</p>
              <a href="#" class="cta-button">Book Again</a>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} LocalBliz. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(to, subject, text, html);
  } catch (error) {
    console.error('Error sending booking cancellation email:', error);
    throw error;
  }
};
