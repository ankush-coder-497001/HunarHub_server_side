# HunarHub - Backend (Node.js + Express + MongoDB +Socket.io)

HunarHub is a worker-first platform connecting local blue-collar workers with customers in need of their services. This repository contains the frontend code built with **React.js** with full **PWA (Progressive Web App)** support, offering an app-like experience directly in the browser.

---
## 🌟 Live Site:

[https://hunarhub-io.netlify.app/](https://hunarhub-io.netlify.app/)


## 🧭 Features:

- ✅ RESTful API for Users, Workers, Admin
- ✅ Location-based worker search (Geo Queries using MongoDB)
- ✅ Socket.io integration for real-time chat
- ✅ Nodemailer for sending emails (for OTPs, booking confirmations, etc.)
- ✅ Node-cron for:
  - Booking reminders
  - Auto-cancel unconfirmed bookings
- ✅ Proper indexing on MongoDB for fast queries
- ✅ Email OTP flow for Password Recovery
- ✅ Admin panel API for managing users, workers, reviews, etc.
- ✅ Error handling for all edge cases (Booking, Authentication, etc.)
- ✅ JobCode verification system (To mark jobs as complete)
- ✅ Protected Routes using JWT
- ✅ Review and Rating APIs
- ✅ Worker Schedule API (Availability management)
- ✅ History APIs for both users and workers
- ✅ Aggregation pipelines for complex data fetching

---

## 🛠️ Technologies Used (Backend):

- Node.js
- Express.js
- MongoDB + Mongoose
- Socket.io
- Nodemailer
- Node-cron
- JWT (for authentication)
- Bcrypt (for password hashing)
- CORS / Helmet / Compression (for security and performance)

---

## 📦 Local Development Setup:

```bash
git clone https://github.com/YourUsername/hunarhub-backend.git
cd hunarhub-backend
npm install
npm start
