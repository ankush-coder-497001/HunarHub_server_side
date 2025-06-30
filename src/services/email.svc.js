import nodemailer from 'nodemailer';
const DeployedURL = 'https://hunarhub-io.netlify.app/'

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
    const subject = 'Welcome to HunarHub!';
    const text = `Hello ${name}, welcome to HunarHub!`;

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Welcome to HunarHub</title>
        <style>
          body {
            font-family: 'Segoe UI', sans-serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            overflow: hidden;
          }
          .header {
            background-color: #34495e;
            color: white;
            text-align: center;
            padding: 30px 20px;
          }
          .content {
            padding: 30px;
            color: #333;
            text-align: center;
          }
          .footer {
            background-color: #f1f1f1;
            text-align: center;
            padding: 15px;
            font-size: 13px;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to HunarHub!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${name}</strong>,</p>
            <p>We're excited to have you on board! 🎉</p>
            <p>Explore skilled professionals, book services easily, and enjoy seamless support — all on <strong>HunarHub</strong>.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} HunarHub. All rights reserved.
          </div>
        </div>
      </body>
    </html>`;

    await sendEmail(to, subject, text, html);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

export const SendOTP = async (to, otp) => {
  try {
    const subject = 'Your OTP Code - HunarHub';
    const text = `Your OTP code is ${otp}`;

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Your OTP Code</title>
        <style>
          body {
            font-family: 'Segoe UI', sans-serif;
            background-color: #f6f6f6;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 500px;
            margin: auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            text-align: center;
          }
          .otp-box {
            background-color: #3498db;
            color: white;
            font-size: 24px;
            font-weight: bold;
            padding: 12px 24px;
            border-radius: 6px;
            display: inline-block;
            margin: 20px 0;
          }
          .footer {
            margin-top: 20px;
            color: #777;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Your OTP Code</h2>
          <p>Use the code below to verify your email address:</p>
          <div class="otp-box">${otp}</div>
          <p>This OTP is valid for a limited time. Do not share it with anyone.</p>
          <div class="footer">
            &copy; ${new Date().getFullYear()} HunarHub
          </div>
        </div>
      </body>
    </html>`;

    await sendEmail(to, subject, text, html);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

export const BookingRequestedEmail = async (to, bookingDetails) => {
  try {
    const { name, service, date, time, location, customerNotes } = bookingDetails;

    const subject = 'Booking Requested - HunarHub';

    const text = `A new booking request has been made.
Service: ${service}
Date: ${date}
Time: ${time}
Location: ${location}
Notes: ${customerNotes || 'N/A'}`;

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Booking Requested - HunarHub</title>
        <style>
          body {
            font-family: 'Segoe UI', sans-serif;
            background-color: #f2f2f2;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: auto;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }
          .header {
            background-color: #2980b9;
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 25px 30px;
            color: #333;
          }
          .details-table td {
            padding: 8px 0;
          }
          .label {
            font-weight: bold;
            width: 140px;
          }
          .footer {
            background-color: #f1f1f1;
            text-align: center;
            padding: 15px;
            font-size: 13px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Request Received</h1>
            <p>via <strong>HunarHub</strong></p>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We've received your booking request. Here's the summary:</p>
            <table class="details-table">
              <tr><td class="label">Service:</td><td>${service}</td></tr>
              <tr><td class="label">Date:</td><td>${date}</td></tr>
              <tr><td class="label">Time:</td><td>${time}</td></tr>
              <tr><td class="label">Location:</td><td>${location}</td></tr>
              <tr><td class="label">Notes:</td><td>${customerNotes || 'N/A'}</td></tr>
            </table>
            <p>You’ll receive a confirmation once your booking is accepted by a professional.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} HunarHub. All rights reserved.
          </div>
        </div>
      </body>
    </html>`;

    await sendEmail(to, subject, text, html);
  } catch (error) {
    console.error('Error sending booking requested email:', error);
    throw error;
  }
};

export const BookingConfirmationEmail = async (to, bookingDetails) => {
  try {
    const { name, service, date, time, location, customerNotes } = bookingDetails;

    const subject = 'Booking Confirmed - HunarHub';

    const text = `Your booking with HunarHub is confirmed.
Service: ${service}
Date: ${date}
Time: ${time}
Location: ${location}
Notes: ${customerNotes || 'N/A'}`;

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Booking Confirmation - HunarHub</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f7f9fb;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }
          .header {
            background-color: #2c3e50;
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .content {
            padding: 25px 30px;
            color: #333;
          }
          .details-table td {
            padding: 10px 0;
          }
          .label {
            font-weight: bold;
            width: 140px;
          }
          .cta-button {
            display: inline-block;
            background-color: #3498db;
            color: white;
            padding: 12px 25px;
            border-radius: 5px;
            text-decoration: none;
            margin-top: 20px;
            font-weight: bold;
          }
          .footer {
            background-color: #ecf0f1;
            text-align: center;
            padding: 15px;
            font-size: 13px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed</h1>
            <p>Thanks for choosing <strong>HunarHub</strong></p>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Your booking has been confirmed. Here's what you need to know:</p>

            <table class="details-table">
              <tr><td class="label">Service:</td><td>${service}</td></tr>
              <tr><td class="label">Date:</td><td>${date}</td></tr>
              <tr><td class="label">Time:</td><td>${time}</td></tr>
              <tr><td class="label">Location:</td><td>${location}</td></tr>
              <tr><td class="label">Notes:</td><td>${customerNotes || 'N/A'}</td></tr>
            </table>

            <p>If you have questions or want to modify your booking, feel free to contact us.</p>
            <a href=${DeployedURL} class="cta-button">Visit HunarHub</a>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} HunarHub. All rights reserved.
          </div>
        </div>
      </body>
    </html>`;

    await sendEmail(to, subject, text, html);
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    throw error;
  }
};

export const BookingCancellationEmail = async (to, bookingDetails) => {
  try {
    const { name, service, date, time, location, customerNotes } = bookingDetails;

    const subject = 'Booking Cancelled - HunarHub';

    const text = `Your booking with HunarHub has been cancelled.
Service: ${service}
Date: ${date}
Time: ${time}
Location: ${location}
Notes: ${customerNotes || 'N/A'}`;

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Booking Cancelled - HunarHub</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #fff9f9;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }
          .header {
            background-color: #e74c3c;
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .content {
            padding: 25px 30px;
            color: #333;
          }
          .details-table td {
            padding: 10px 0;
          }
          .label {
            font-weight: bold;
            width: 140px;
          }
          .cta-button {
            display: inline-block;
            background-color: #3498db;
            color: white;
            padding: 12px 25px;
            border-radius: 5px;
            text-decoration: none;
            margin-top: 20px;
            font-weight: bold;
          }
          .footer {
            background-color: #f1f1f1;
            text-align: center;
            padding: 15px;
            font-size: 13px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Booking Cancelled</h1>
            <p>Your booking with <strong>HunarHub</strong> was cancelled</p>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We regret to inform you that your booking has been cancelled. Details below:</p>

            <table class="details-table">
              <tr><td class="label">Service:</td><td>${service}</td></tr>
              <tr><td class="label">Date:</td><td>${date}</td></tr>
              <tr><td class="label">Time:</td><td>${time}</td></tr>
              <tr><td class="label">Location:</td><td>${location}</td></tr>
              <tr><td class="label">Notes:</td><td>${customerNotes || 'N/A'}</td></tr>
            </table>

            <p>If this was an error or you'd like to rebook, please click the button below.</p>
            <a href="#" class="cta-button">Book Again</a>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} HunarHub. All rights reserved.
          </div>
        </div>
      </body>
    </html>`;

    await sendEmail(to, subject, text, html);
  } catch (error) {
    console.error('Error sending booking cancellation email:', error);
    throw error;
  }
};

export const sendOneHourBeforeReminderEmail = async (to, bookingDetails) => {
  try {
    const { name, service, date, time, location, phone } = bookingDetails;

    const subject = 'Upcoming Job Reminder - 1 Hour Left | HunarHub';

    const text = `Reminder: You have a job scheduled in 1 hour.
Service: ${service}
Date: ${date}
Time: ${time}
Location: ${location}
Customer: ${name}, ${phone}
    `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Job Reminder - HunarHub</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f7f9fb;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: auto;
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background-color: #2c3e50;
              color: white;
              padding: 25px 20px;
              text-align: center;
            }
            .content {
              padding: 25px 30px;
              color: #333;
            }
            .content h2 {
              margin-top: 0;
            }
            .details-table {
              width: 100%;
              margin-top: 20px;
              border-collapse: collapse;
            }
            .details-table td {
              padding: 10px 0;
            }
            .details-table .label {
              font-weight: bold;
              width: 150px;
            }
            .footer {
              background-color: #f0f0f0;
              text-align: center;
              padding: 15px;
              font-size: 13px;
              color: #888;
            }
            .cta-button {
              display: inline-block;
              background-color: #2980b9;
              color: white;
              padding: 10px 20px;
              border-radius: 5px;
              text-decoration: none;
              margin-top: 25px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Job Reminder</h1>
              <p>Your job starts in 1 hour</p>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>This is a quick reminder that your upcoming job starts in 1 hour. Please be prepared.</p>

              <table class="details-table">
                <tr><td class="label">Service:</td><td>${service}</td></tr>
                <tr><td class="label">Date:</td><td>${date}</td></tr>
                <tr><td class="label">Time:</td><td>${time}</td></tr>
                <tr><td class="label">Location:</td><td>${location}</td></tr>
                <tr><td class="label">Customer:</td><td>${name}, ${phone}</td></tr>
              </table>

              <a href=${DeployedURL} class="cta-button">View Booking</a>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} HunarHub. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(to, subject, text, html);
  } catch (error) {
    console.error('Error sending 1-hour reminder email:', error);
    throw error;
  }
};

export const sendThirtyMinBeforeReminderEmail = async (to, bookingDetails) => {
  try {
    const { name, service, date, time, location, phone } = bookingDetails;

    const subject = 'Upcoming Job Reminder - 30 Minutes Left | HunarHub';

    const text = `Reminder: Your job is starting in 30 minutes.
Service: ${service}
Date: ${date}
Time: ${time}
Location: ${location}
Customer: ${name}, ${phone}
    `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Job Reminder - HunarHub</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f7f9fb;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: auto;
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background-color: #2c3e50;
              color: white;
              padding: 25px 20px;
              text-align: center;
            }
            .content {
              padding: 25px 30px;
              color: #333;
            }
            .content h2 {
              margin-top: 0;
            }
            .details-table {
              width: 100%;
              margin-top: 20px;
              border-collapse: collapse;
            }
            .details-table td {
              padding: 10px 0;
            }
            .details-table .label {
              font-weight: bold;
              width: 150px;
            }
            .footer {
              background-color: #f0f0f0;
              text-align: center;
              padding: 15px;
              font-size: 13px;
              color: #888;
            }
            .cta-button {
              display: inline-block;
              background-color: #2980b9;
              color: white;
              padding: 10px 20px;
              border-radius: 5px;
              text-decoration: none;
              margin-top: 25px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Job Reminder</h1>
              <p>Your job starts in 1 hour</p>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>This is a quick reminder that your upcoming job starts in 30 minutes. Please be prepared.</p>

              <table class="details-table">
                <tr><td class="label">Service:</td><td>${service}</td></tr>
                <tr><td class="label">Date:</td><td>${date}</td></tr>
                <tr><td class="label">Time:</td><td>${time}</td></tr>
                <tr><td class="label">Location:</td><td>${location}</td></tr>
                <tr><td class="label">Customer:</td><td>${name}, ${phone}</td></tr>
              </table>

              <a href=${DeployedURL} class="cta-button">View Booking</a>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} HunarHub. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(to, subject, text, html);
  } catch (error) {
    console.error('Error sending 30-min reminder email:', error);
    throw error;
  }
};

//done
export const sendAutoCancelledBookingEmail = async (to, bookingDetails) => {
  try {
    const { name, service, date, time, location } = bookingDetails;

    const subject = 'Job Automatically Cancelled | HunarHub';

    const text = `The job you accepted but did not act upon has been cancelled automatically.
Service: ${service}
Date: ${date}
Time: ${time}
Location: ${location}

This action was taken because the job time passed 3 hours ago without completion.`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Booking Auto-Cancelled - HunarHub</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #fdf8f2;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: auto;
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.07);
              overflow: hidden;
            }
            .header {
              background-color: #c0392b;
              color: white;
              padding: 25px 20px;
              text-align: center;
            }
            .content {
              padding: 25px 30px;
              color: #444;
            }
            .details-table td {
              padding: 8px 0;
            }
            .label {
              font-weight: bold;
              width: 150px;
            }
            .footer {
              background-color: #f2f2f2;
              text-align: center;
              padding: 12px;
              font-size: 13px;
              color: #888;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚫 Booking Auto-Cancelled</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>This booking has been automatically cancelled because it was not completed or acted upon within 3 hours of the scheduled time.</p>

              <table class="details-table">
                <tr><td class="label">Service:</td><td>${service}</td></tr>
                <tr><td class="label">Date:</td><td>${date}</td></tr>
                <tr><td class="label">Time:</td><td>${time}</td></tr>
                <tr><td class="label">Location:</td><td>${location}</td></tr>
              </table>

              <p>Please make sure to manage your bookings on time to avoid cancellations in the future.</p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} HunarHub. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(to, subject, text, html);
  } catch (error) {
    console.error('Error sending auto-cancelled booking email:', error);
    throw error;
  }
};



