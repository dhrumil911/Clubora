import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';
import { query } from '../config/db.js';

/**
 * Common Login for all roles (OWNER, FRONT_DESK_STAFF, BAR_SHOP_STAFF, MEMBER)
 */
export async function login(req, res) {
  try {
    const { email, password, targetRole } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = await query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Role Verification if targetRole is explicitly requested by the portal
    if (targetRole && targetRole !== 'ANY') {
      const uRole = user.role;
      let matches = (uRole === targetRole);

      // Support aliases
      if ((targetRole === 'FRONT_DESK_STAFF' || targetRole === 'FRONT_DESK') && (uRole === 'FRONT_DESK' || uRole === 'FRONT_DESK_STAFF')) matches = true;
      if (targetRole === 'BAR_SHOP_STAFF' && (uRole === 'BAR' || uRole === 'SHOP' || uRole === 'BAR_SHOP_STAFF' || uRole === 'BAR_STAFF' || uRole === 'SHOP_STAFF')) matches = true;
      if ((targetRole === 'BAR_STAFF' || targetRole === 'BAR') && (uRole === 'BAR' || uRole === 'BAR_STAFF' || uRole === 'BAR_SHOP_STAFF')) matches = true;
      if ((targetRole === 'SHOP_STAFF' || targetRole === 'SHOP') && (uRole === 'SHOP' || uRole === 'SHOP_STAFF' || uRole === 'BAR_SHOP_STAFF')) matches = true;
      if (targetRole === 'OWNER' && uRole === 'OWNER') matches = true;
      if (targetRole === 'MEMBER' && uRole === 'MEMBER') matches = true;

      if (!matches) {
        return res.status(403).json({
          error: `Access Denied: Account role (${user.role.replace('_', ' ')}) is not authorized for ${targetRole.replace('_', ' ')} portal.`
        });
      }
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
}

/**
 * Member Signup (Task 4)
 * Public signup ONLY creates MEMBER role accounts.
 */
export async function register(req, res) {
  try {
    const { 
      name, email, phone, password, confirmPassword, 
      tierName = 'Gold', tierId, durationMonths = 12 
    } = req.body;

    // 1. Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields (name, email, phone, password, confirm password) are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (phone.trim().length < 7) {
      return res.status(400).json({ error: 'Please enter a valid phone number.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Password and Confirm Password do not match.' });
    }

    // 2. Email uniqueness check
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // 3. Hash password and save User with role = MEMBER
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr-mem-${Date.now()}`;

    await query(
      `INSERT INTO users (id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'MEMBER')`,
      [userId, cleanEmail, passwordHash, name.trim()]
    );

    // 4. Create corresponding Member profile with selected Tier & Duration
    const countRes = await query('SELECT COUNT(*) FROM members');
    const memberCount = parseInt(countRes[0].count, 10) + 1;

    // Resolve selected tier (Gold, Silver, Junior)
    let selectedTier = null;
    if (tierId) {
      const tRes = await query(`SELECT * FROM membership_tiers WHERE id = $1`, [tierId]);
      if (tRes.length > 0) selectedTier = tRes[0];
    }
    if (!selectedTier && tierName) {
      const tRes = await query(`SELECT * FROM membership_tiers WHERE LOWER(name) = LOWER($1)`, [tierName]);
      if (tRes.length > 0) selectedTier = tRes[0];
    }
    if (!selectedTier) {
      const tRes = await query(`SELECT * FROM membership_tiers WHERE name = 'Gold' OR name = 'Silver' LIMIT 1`);
      if (tRes.length > 0) selectedTier = tRes[0];
    }

    const tierCode = selectedTier ? selectedTier.name.substring(0, 4).toUpperCase() : 'GOLD';
    const memberCode = `MEM-${tierCode}-${String(memberCount).padStart(3, '0')}`;
    const memberId = `mem-${Date.now()}`;
    
    // Calculate expiration based on 3, 6, or 12 months
    const joinedAt = new Date();
    const expiresAt = new Date();
    const months = parseInt(durationMonths, 10) || 12;
    expiresAt.setMonth(joinedAt.getMonth() + months);

    await query(
      `INSERT INTO members (id, member_code, name, email, phone, tier_id, joined_at, expires_at, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')`,
      [memberId, memberCode, name.trim(), cleanEmail, phone.trim(), selectedTier?.id || 'tier-gold', joinedAt.toISOString(), expiresAt.toISOString()]
    );

    // 5. Issue JWT Token
    const token = generateToken({
      id: userId,
      email: cleanEmail,
      name: name.trim(),
      role: 'MEMBER'
    });

    return res.status(201).json({
      message: 'Registration successful! Welcome to Clubora.',
      token,
      user: {
        id: userId,
        email: cleanEmail,
        name: name.trim(),
        role: 'MEMBER'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to complete registration.' });
  }
}

/**
 * Get Profile of logged in user
 */
export async function getProfile(req, res) {
  try {
    const users = await query('SELECT id, email, name, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    return res.json(users[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
}
