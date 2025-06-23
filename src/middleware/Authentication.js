const jwt = require('jsonwebtoken');

const Auth = (req, res, next) => {
  try {
    const authHeader = req.authHeader || req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.log(err);
        if (err.name === 'TokenExpiredError') {
          return res.status(403).json({ message: 'Token is expired', invalidToken: true });
        }
        return res.status(403).json({ message: 'Invalid token' });
      }
      req.user = user;
      next();
    });

  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

module.exports = Auth;