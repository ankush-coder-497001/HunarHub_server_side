const admin = require('../firebaseAdmin');
const UserModel = require('../models/user.model');

const sendPushNotification = async (userId, title, body) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    console.error('User not found');
    return;
  }

  const message = {
    notification: { title, body },
    token: user.fcmToken,
  };

  try {
    await admin.messaging().send(message);
    console.log('Notification sent');
  } catch (err) {
    console.error('Failed to send notification:', err);
  }
};


module.exports = sendPushNotification;