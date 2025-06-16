const User = require('../models/user.model');

const RoleValidation = (roles) => {
  return async (req, res, next) => {
    try {
      const { userId } = req.user; // Assuming user ID is stored in req.user after authentication
      const user = await
        User.findById(userId).select('role'); // Fetch user role from the database
      if (!user) {
        return res.status(404).json({ message: 'User not found during role validation' });
      }
      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: 'Access denied: insufficient permissions' });
      }
      next(); // User has the required role, proceed to the next middleware or route handler
    }
    catch (error) {
      console.error('Role validation error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
module.exports = RoleValidation;
