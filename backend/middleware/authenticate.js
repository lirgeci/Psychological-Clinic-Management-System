const jwt = require('jsonwebtoken');

// Map role names to numeric IDs used in tokens/DB
const ROLE_MAP = {
  admin: 1,
  therapist: 2,
  patient: 3,
};

/**
 * authenticate(allowedRoles: string[] | number[])
 * Returns express middleware that verifies a Bearer JWT, attaches decoded claims
 * to req.user and enforces that the caller's role is in allowedRoles.
 */
module.exports = function authenticate(allowedRoles = []) {
  // Normalize allowed roles to numeric ids for comparison
  const allowedIds = allowedRoles.map((r) => {
    if (typeof r === 'number') return r;
    const key = String(r).toLowerCase();
    return ROLE_MAP[key] || null;
  }).filter((v) => v != null);

  return (req, res, next) => {
    try {
      const auth = req.get('Authorization') || '';
      if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const token = auth.slice('Bearer '.length).trim();
      if (!token) return res.status(401).json({ message: 'Unauthorized' });

      const secret = process.env.JWT_SECRET || 'secret';
      let decoded;
      try {
        decoded = jwt.verify(token, secret);
      } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Attach decoded claims to req.user for downstream handlers
      req.user = decoded;

      // If no allowed roles were provided, treat as authenticated-only
      if (allowedIds.length === 0) return next();

      // Determine caller role id from token claims (support roleId or role)
      const roleId = decoded.roleId || decoded.role || null;

      // If token carried a string role (e.g., 'Admin'), map it
      let callerRoleId = null;
      if (typeof roleId === 'number') callerRoleId = roleId;
      else if (typeof roleId === 'string') {
        const key = roleId.toLowerCase();
        callerRoleId = ROLE_MAP[key] || null;
      }

      if (!callerRoleId) return res.status(403).json({ message: 'Forbidden' });

      if (!allowedIds.includes(callerRoleId)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      return next();
    } catch (error) {
      return res.status(500).json({ message: 'Authentication error' });
    }
  };
};
