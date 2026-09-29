/**
 * SkillSwap Database Layer
 * Powered by Node.js built-in node:sqlite (DatabaseSync) and native crypto.
 * Comprehensive schema & operations for a professional peer learning platform.
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const crypto = require('node:crypto');

const DB_PATH = path.join(__dirname, 'skillswap.db');
const db = new DatabaseSync(DB_PATH);

// Configure SQLite pragmas for high performance & integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT,
    salt TEXT,
    full_name TEXT NOT NULL,
    role_title TEXT DEFAULT 'Skill Swapper',
    avatar_url TEXT DEFAULT '',
    skills_teach TEXT DEFAULT '',
    skills_learn TEXT DEFAULT '',
    project_interest TEXT DEFAULT '',
    cadence TEXT DEFAULT 'Weekly Google Meet Sessions',
    bio TEXT DEFAULT '',
    google_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    learn_skill TEXT NOT NULL,
    teach_skill TEXT NOT NULL,
    message TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    proposal_id INTEGER,
    meet_url TEXT DEFAULT 'https://meet.google.com/qmv-ytpk-zbw',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(user2_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(proposal_id) REFERENCES proposals(id) ON DELETE SET NULL,
    UNIQUE(user1_id, user2_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reviewer_id INTEGER NOT NULL,
    reviewee_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(reviewee_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER,
    title TEXT NOT NULL,
    host_id INTEGER NOT NULL,
    participant_id INTEGER NOT NULL,
    scheduled_time TEXT,
    meet_url TEXT DEFAULT 'https://meet.google.com/qmv-ytpk-zbw',
    status TEXT DEFAULT 'scheduled',
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE SET NULL,
    FOREIGN KEY(host_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(participant_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT DEFAULT '',
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    saved_user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(saved_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, saved_user_id)
  );

  CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT DEFAULT 'General',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT DEFAULT '',
    likes_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS post_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(post_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS swipe_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    swiper_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    direction TEXT NOT NULL DEFAULT 'right',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(swiper_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(target_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Safe column migrations for pre-existing SQLite database files
try { db.exec("ALTER TABLE sessions ADD COLUMN notes TEXT DEFAULT '';"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT '';"); } catch (e) {}
try { db.exec("ALTER TABLE notifications ADD COLUMN link TEXT DEFAULT '';"); } catch (e) {}

// -----------------------------------------------------------------
// Security, Hashing & Session Token Utilities
// -----------------------------------------------------------------

const TOKEN_SECRET = 'skillswap-secret-token-key-2026-dynamic-app';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  if (!password || !hash || !salt) return false;
  try {
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
  } catch (e) {
    return false;
  }
}

function generateSessionToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    userId: user.id,
    email: user.email,
    name: user.full_name,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
  })).toString('base64url');

  const signature = crypto.createHmac('sha256', TOKEN_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  if (signature !== expectedSig) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && data.exp < Date.now()) return null;
    return data;
  } catch (e) {
    return null;
  }
}

// -----------------------------------------------------------------
// User Operations
// -----------------------------------------------------------------

function createUser({ email, password, full_name, role_title, avatar_url, skills_teach, skills_learn, project_interest, cadence, bio, google_id }) {
  let hash = null;
  let salt = null;
  if (password) {
    const hashed = hashPassword(password);
    hash = hashed.hash;
    salt = hashed.salt;
  }

  const stmt = db.prepare(`
    INSERT INTO users (email, password_hash, salt, full_name, role_title, avatar_url, skills_teach, skills_learn, project_interest, cadence, bio, google_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    email.toLowerCase().trim(),
    hash,
    salt,
    full_name.trim(),
    role_title || 'Skill Swapper',
    avatar_url || 'person 2.jpeg',
    skills_teach || '',
    skills_learn || '',
    project_interest || '',
    cadence || 'Weekly Google Meet Sessions',
    bio || '',
    google_id || null
  );

  return getUserById(result.lastInsertRowid);
}

function getUserByEmail(email) {
  if (!email) return null;
  const stmt = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE');
  return stmt.get(email.toLowerCase().trim());
}

function getUserById(id) {
  if (!id) return null;
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(id);
  if (!user) return null;

  const ratingStmt = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE reviewee_id = ?');
  const ratingData = ratingStmt.get(id);

  return {
    ...user,
    avg_rating: ratingData && ratingData.avg_rating ? Number(Number(ratingData.avg_rating).toFixed(1)) : null,
    review_count: ratingData ? ratingData.review_count : 0
  };
}

function updateUserProfile(id, updates) {
  const fields = [];
  const values = [];

  const allowedFields = ['full_name', 'role_title', 'avatar_url', 'skills_teach', 'skills_learn', 'project_interest', 'cadence', 'bio'];
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }

  if (fields.length === 0) return getUserById(id);

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  db.prepare(query).run(...values);

  return getUserById(id);
}

function getAllUsers(currentUserId = null) {
  const stmt = db.prepare('SELECT id, full_name, email, role_title, avatar_url, skills_teach, skills_learn, project_interest, cadence, bio, created_at FROM users ORDER BY id DESC');
  const users = stmt.all();

  const favSet = new Set();
  if (currentUserId) {
    const favs = db.prepare('SELECT saved_user_id FROM favorites WHERE user_id = ?').all(currentUserId);
    favs.forEach(f => favSet.add(f.saved_user_id));
  }

  return users.map(user => {
    const ratingStmt = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE reviewee_id = ?');
    const ratingData = ratingStmt.get(user.id);
    return {
      ...user,
      avg_rating: ratingData && ratingData.avg_rating ? Number(Number(ratingData.avg_rating).toFixed(1)) : null,
      review_count: ratingData ? ratingData.review_count : 0,
      is_current_user: currentUserId ? user.id === currentUserId : false,
      is_favorite: favSet.has(user.id)
    };
  });
}

// -----------------------------------------------------------------
// Favorites Operations
// -----------------------------------------------------------------

function addFavorite(userId, savedUserId) {
  if (userId === savedUserId) return false;
  try {
    db.prepare('INSERT OR IGNORE INTO favorites (user_id, saved_user_id) VALUES (?, ?)').run(userId, savedUserId);
    return true;
  } catch (e) {
    return false;
  }
}

function removeFavorite(userId, savedUserId) {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND saved_user_id = ?').run(userId, savedUserId);
  return true;
}

function getUserFavorites(userId) {
  const stmt = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.role_title, u.avatar_url, u.skills_teach, u.skills_learn, u.project_interest, u.cadence, u.bio, f.created_at as favorited_at
    FROM favorites f
    JOIN users u ON f.saved_user_id = u.id
    WHERE f.user_id = ?
    ORDER BY f.id DESC
  `);
  const users = stmt.all(userId);
  return users.map(u => {
    const ratingStmt = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE reviewee_id = ?');
    const ratingData = ratingStmt.get(u.id);
    return {
      ...u,
      avg_rating: ratingData && ratingData.avg_rating ? Number(Number(ratingData.avg_rating).toFixed(1)) : null,
      review_count: ratingData ? ratingData.review_count : 0,
      is_favorite: true
    };
  });
}

// -----------------------------------------------------------------
// Notifications Operations
// -----------------------------------------------------------------

function createNotification({ user_id, type, title, message, link }) {
  const stmt = db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (?, ?, ?, ?, ?)
  `);
  const res = stmt.run(user_id, type, title, message, link || '');
  return db.prepare('SELECT * FROM notifications WHERE id = ?').get(res.lastInsertRowid);
}

function getUserNotifications(userId) {
  const stmt = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 30');
  return stmt.all(userId);
}

function markNotificationAsRead(id, userId) {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
  return true;
}

function markAllNotificationsAsRead(userId) {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
  return true;
}

// -----------------------------------------------------------------
// Proposals Operations
// -----------------------------------------------------------------

function createProposal({ sender_id, receiver_id, learn_skill, teach_skill, message }) {
  const stmt = db.prepare(`
    INSERT INTO proposals (sender_id, receiver_id, learn_skill, teach_skill, message)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(sender_id, receiver_id, learn_skill, teach_skill, message || '');
  const prop = getProposalById(result.lastInsertRowid);

  createNotification({
    user_id: receiver_id,
    type: 'proposal_received',
    title: 'New Exchange Proposal',
    message: `${prop.sender_name} wants to swap: Teach “${teach_skill}” for “${learn_skill}”`,
    link: '#discover'
  });

  return prop;
}

function getProposalById(id) {
  const stmt = db.prepare(`
    SELECT p.*,
      s.full_name as sender_name, s.email as sender_email, s.avatar_url as sender_avatar,
      r.full_name as receiver_name, r.email as receiver_email, r.avatar_url as receiver_avatar
    FROM proposals p
    JOIN users s ON p.sender_id = s.id
    JOIN users r ON p.receiver_id = r.id
    WHERE p.id = ?
  `);
  return stmt.get(id);
}

function getUserProposals(userId) {
  const stmt = db.prepare(`
    SELECT p.*,
      s.full_name as sender_name, s.email as sender_email, s.avatar_url as sender_avatar,
      r.full_name as receiver_name, r.email as receiver_email, r.avatar_url as receiver_avatar
    FROM proposals p
    JOIN users s ON p.sender_id = s.id
    JOIN users r ON p.receiver_id = r.id
    WHERE p.sender_id = ? OR p.receiver_id = ?
    ORDER BY p.id DESC
  `);
  return stmt.all(userId, userId);
}

function updateProposalStatus(id, status) {
  db.prepare('UPDATE proposals SET status = ? WHERE id = ?').run(status, id);
  const proposal = getProposalById(id);

  if (status === 'accepted') {
    let conv = getOrCreateConversation(proposal.sender_id, proposal.receiver_id, proposal.id);

    createSession({
      conversation_id: conv.id,
      title: `Skill Exchange: ${proposal.learn_skill} ⇄ ${proposal.teach_skill}`,
      host_id: proposal.sender_id,
      participant_id: proposal.receiver_id,
      scheduled_time: 'Next Friday · 6:30 PM (BST)',
      meet_url: conv.meet_url,
      notes: proposal.message || 'Kickoff session'
    });

    addMessage({
      conversation_id: conv.id,
      sender_id: proposal.receiver_id,
      text: `Hi ${proposal.sender_name.split(' ')[0]}! I accepted your exchange proposal for "${proposal.learn_skill} ⇄ ${proposal.teach_skill}". Looking forward to learning together!`
    });

    createNotification({
      user_id: proposal.sender_id,
      type: 'proposal_accepted',
      title: 'Proposal Accepted! 🎉',
      message: `${proposal.receiver_name} accepted your swap request! Start chatting or meet in Google Meet.`,
      link: '#sessions'
    });
  }

  return proposal;
}

// -----------------------------------------------------------------
// Conversation & Messages Operations
// -----------------------------------------------------------------

function getOrCreateConversation(userIdA, userIdB, proposalId = null) {
  const u1 = Math.min(userIdA, userIdB);
  const u2 = Math.max(userIdA, userIdB);

  let conv = db.prepare('SELECT * FROM conversations WHERE user1_id = ? AND user2_id = ?').get(u1, u2);
  if (!conv) {
    const randomMeetCode = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    const meetUrl = `https://meet.google.com/${randomMeetCode}`;

    const stmt = db.prepare(`
      INSERT INTO conversations (user1_id, user2_id, proposal_id, meet_url)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(u1, u2, proposalId, meetUrl);
    conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(result.lastInsertRowid);
  }
  return conv;
}

function getUserConversations(userId) {
  const stmt = db.prepare(`
    SELECT c.*,
      CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END as other_user_id
    FROM conversations c
    WHERE c.user1_id = ? OR c.user2_id = ?
    ORDER BY c.updated_at DESC
  `);
  const convs = stmt.all(userId, userId);

  return convs.map(conv => {
    const otherUser = getUserById(conv.other_user_id);
    const lastMsg = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1').get(conv.id);
    return {
      ...conv,
      other_user: otherUser,
      last_message: lastMsg || null
    };
  });
}

function updateConversationMeet(convId, meetUrl) {
  db.prepare('UPDATE conversations SET meet_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(meetUrl, convId);
  return db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
}

function addMessage({ conversation_id, sender_id, text }) {
  const stmt = db.prepare(`
    INSERT INTO messages (conversation_id, sender_id, text)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(conversation_id, sender_id, text);
  db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversation_id);

  const msg = db.prepare(`
    SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `).get(result.lastInsertRowid);

  const conv = db.prepare('SELECT user1_id, user2_id FROM conversations WHERE id = ?').get(conversation_id);
  if (conv) {
    const otherUserId = conv.user1_id === sender_id ? conv.user2_id : conv.user1_id;
    createNotification({
      user_id: otherUserId,
      type: 'message_received',
      title: `Message from ${msg.sender_name}`,
      message: text.length > 60 ? `${text.substring(0, 60)}...` : text,
      link: '#sessions'
    });
  }

  return msg;
}

function getConversationMessages(conversationId) {
  const stmt = db.prepare(`
    SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = ?
    ORDER BY m.id ASC
  `);
  return stmt.all(conversationId);
}

// -----------------------------------------------------------------
// Review Operations
// -----------------------------------------------------------------

function addReview({ reviewer_id, reviewee_id, rating, review_text }) {
  const stmt = db.prepare(`
    INSERT INTO reviews (reviewer_id, reviewee_id, rating, review_text)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(reviewer_id, reviewee_id, rating, review_text);
  const rev = getReviewById(result.lastInsertRowid);

  createNotification({
    user_id: reviewee_id,
    type: 'review_received',
    title: 'New Rating & Review! ⭐',
    message: `${rev.reviewer_name} gave you ${rating} stars: "${review_text.substring(0, 50)}..."`,
    link: '#community'
  });

  return rev;
}

function getReviewById(id) {
  const stmt = db.prepare(`
    SELECT r.*,
      reviewer.full_name as reviewer_name, reviewer.avatar_url as reviewer_avatar,
      reviewee.full_name as reviewee_name, reviewee.avatar_url as reviewee_avatar
    FROM reviews r
    JOIN users reviewer ON r.reviewer_id = reviewer.id
    JOIN users reviewee ON r.reviewee_id = reviewee.id
    WHERE r.id = ?
  `);
  return stmt.get(id);
}

function getAllReviews() {
  const stmt = db.prepare(`
    SELECT r.*,
      reviewer.full_name as reviewer_name, reviewer.avatar_url as reviewer_avatar, reviewer.role_title as reviewer_role,
      reviewee.full_name as reviewee_name, reviewee.avatar_url as reviewee_avatar, reviewee.role_title as reviewee_role
    FROM reviews r
    JOIN users reviewer ON r.reviewer_id = reviewer.id
    JOIN users reviewee ON r.reviewee_id = reviewee.id
    ORDER BY r.id DESC
  `);
  return stmt.all();
}

function getUserReviews(userId) {
  const stmt = db.prepare(`
    SELECT r.*,
      reviewer.full_name as reviewer_name, reviewer.avatar_url as reviewer_avatar, reviewer.role_title as reviewer_role
    FROM reviews r
    JOIN users reviewer ON r.reviewer_id = reviewer.id
    WHERE r.reviewee_id = ?
    ORDER BY r.id DESC
  `);
  return stmt.all(userId);
}

// -----------------------------------------------------------------
// Sessions Operations
// -----------------------------------------------------------------

function createSession({ conversation_id, title, host_id, participant_id, scheduled_time, meet_url, notes }) {
  const stmt = db.prepare(`
    INSERT INTO sessions (conversation_id, title, host_id, participant_id, scheduled_time, meet_url, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    conversation_id || null,
    title,
    host_id,
    participant_id,
    scheduled_time || 'Next Week · 6:00 PM',
    meet_url || 'https://meet.google.com/qmv-ytpk-zbw',
    notes || ''
  );

  const sess = getSessionById(result.lastInsertRowid);

  createNotification({
    user_id: participant_id,
    type: 'session_scheduled',
    title: 'New Exchange Session Scheduled',
    message: `${sess.host_name} scheduled: ${title} (${scheduled_time})`,
    link: '#sessions'
  });

  return sess;
}

function getSessionById(id) {
  const stmt = db.prepare(`
    SELECT s.*,
      host.full_name as host_name, host.avatar_url as host_avatar,
      part.full_name as participant_name, part.avatar_url as participant_avatar
    FROM sessions s
    JOIN users host ON s.host_id = host.id
    JOIN users part ON s.participant_id = part.id
    WHERE s.id = ?
  `);
  return stmt.get(id);
}

function updateSession(id, updates) {
  const fields = [];
  const values = [];

  const allowedFields = ['title', 'scheduled_time', 'meet_url', 'status', 'notes'];
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }

  if (fields.length === 0) return getSessionById(id);

  values.push(id);
  const query = `UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`;
  db.prepare(query).run(...values);

  return getSessionById(id);
}

function deleteSession(id) {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  return true;
}

function getUserSessions(userId) {
  const stmt = db.prepare(`
    SELECT s.*,
      host.full_name as host_name, host.avatar_url as host_avatar,
      part.full_name as participant_name, part.avatar_url as participant_avatar
    FROM sessions s
    JOIN users host ON s.host_id = host.id
    JOIN users part ON s.participant_id = part.id
    WHERE s.host_id = ? OR s.participant_id = ?
    ORDER BY s.id DESC
  `);
  return stmt.all(userId, userId);
}

// -----------------------------------------------------------------
// Community Posts Operations
// -----------------------------------------------------------------

function getCommunityPosts(currentUserId = null, category = null) {
  let query = `
    SELECT p.*,
      u.full_name as author_name, u.avatar_url as author_avatar, u.role_title as author_role
    FROM community_posts p
    JOIN users u ON p.user_id = u.id
  `;
  const params = [];

  if (category && category !== 'all') {
    query += ' WHERE p.category = ? COLLATE NOCASE';
    params.push(category);
  }

  query += ' ORDER BY p.id DESC';

  const posts = db.prepare(query).all(...params);

  const likedPostIds = new Set();
  if (currentUserId) {
    const likes = db.prepare('SELECT post_id FROM post_likes WHERE user_id = ?').all(currentUserId);
    likes.forEach(l => likedPostIds.add(l.post_id));
  }

  return posts.map(p => ({
    ...p,
    has_liked: likedPostIds.has(p.id)
  }));
}

function createCommunityPost({ user_id, title, content, category, tags }) {
  const stmt = db.prepare(`
    INSERT INTO community_posts (user_id, title, content, category, tags)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(user_id, title.trim(), content.trim(), category || 'General', tags || '');
  return db.prepare(`
    SELECT p.*, u.full_name as author_name, u.avatar_url as author_avatar, u.role_title as author_role
    FROM community_posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(result.lastInsertRowid);
}

function togglePostLike(postId, userId) {
  const existing = db.prepare('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?').get(postId, userId);
  if (existing) {
    db.prepare('DELETE FROM post_likes WHERE id = ?').run(existing.id);
    db.prepare('UPDATE community_posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').run(postId);
    return { liked: false };
  } else {
    db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(postId, userId);
    db.prepare('UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ?').run(postId);
    return { liked: true };
  }
}

// -----------------------------------------------------------------
// Platform Stats
// -----------------------------------------------------------------

function getPlatformStats() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const exchangeCount = db.prepare('SELECT COUNT(*) as count FROM conversations').get().count;
  const sessionCount = db.prepare('SELECT COUNT(*) as count FROM sessions').get().count;
  const reviewCount = db.prepare('SELECT COUNT(*) as count FROM reviews').get().count;
  const avgRatingData = db.prepare('SELECT AVG(rating) as avg FROM reviews').get();

  return {
    total_users: userCount,
    total_exchanges: exchangeCount,
    total_sessions: sessionCount,
    total_reviews: reviewCount,
    avg_community_rating: avgRatingData && avgRatingData.avg ? Number(Number(avgRatingData.avg).toFixed(1)) : 5.0
  };
}

// -----------------------------------------------------------------
// Seed Initial Verified Community Data
// -----------------------------------------------------------------

function seedDefaultData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  console.log('🌱 Seeding fresh SkillSwap community database...');

  const u1 = createUser({
    email: 'sadia@skillswap.io',
    password: 'password123',
    full_name: 'Sadia Ahmed Mim',
    role_title: 'Lead UI/UX Designer',
    avatar_url: 'mim.jpg',
    skills_teach: 'Figma, Design Systems, UI/UX Design, Interaction Design',
    skills_learn: 'React, 3D Web, Next.js, WebGL',
    project_interest: '3D Interactive Brand Guidelines',
    cadence: 'Weekly Google Meet Sessions',
    bio: 'Senior UI/UX architect with 6+ years creating scalable enterprise design systems and motion prototypes.'
  });

  const u2 = createUser({
    email: 'khaled@skillswap.io',
    password: 'password123',
    full_name: 'Khaled Saifullah',
    role_title: 'Full-Stack Engineer & Storyteller',
    avatar_url: 'saif.jpg',
    skills_teach: 'React, Node.js, Photography, UX Writing, TypeScript',
    skills_learn: 'Cloud DevOps, Brand Strategy, Docker, Kubernetes',
    project_interest: 'Open-Source Photography CMS',
    cadence: '2 sessions/week · 45 mins each',
    bio: 'Software builder with a passion for creative visual arts, microservices, and technical storytelling.'
  });

  const u3 = createUser({
    email: 'shoptorshi@skillswap.io',
    password: 'password123',
    full_name: 'Shoptorshi Chumky',
    role_title: 'Software Engineer & Tech Speaker',
    avatar_url: 'shoptoshi.jpg',
    skills_teach: 'Python, Public Speaking, Presentation, Data Science',
    skills_learn: 'English Fluency, Machine Learning, Neural Networks',
    project_interest: 'AI Speech Clarity Evaluator',
    cadence: 'Flexible / Weekend sprints',
    bio: 'Tech conference keynote speaker and Python developer helping peers master clear public presentations.'
  });

  const u4 = createUser({
    email: 'miraz@skillswap.io',
    password: 'password123',
    full_name: 'Miraz Montasir',
    role_title: 'Brand Strategist & Creative Director',
    avatar_url: 'miraz.jpg',
    skills_teach: 'Brand Strategy, Motion Design, HTML, Visual Identity',
    skills_learn: 'Full-Stack Development, Python, Backend Architecture',
    project_interest: 'Interactive 3D Brand Storytelling',
    cadence: 'Weekly Google Meet Sessions',
    bio: 'Creative director crafting timeless brand narratives and motion identities for high-growth tech ventures.'
  });

  const u5 = createUser({
    email: 'elena@skillswap.io',
    password: 'password123',
    full_name: 'Elena Rostova',
    role_title: 'Motion Graphics Animator',
    avatar_url: 'person 4.jpeg',
    skills_teach: 'After Effects, 3D Web, Blender, Lottie',
    skills_learn: 'JavaScript, WebGL, Shader Programming',
    project_interest: 'Interactive Web Animation Library',
    cadence: 'Weekly Google Meet Sessions',
    bio: '3D Animator looking to bridge the gap between creative visual motion and real-time WebGL experiences.'
  });

  const u6 = createUser({
    email: 'marcus@skillswap.io',
    password: 'password123',
    full_name: 'Marcus Vance',
    role_title: 'Product Growth Strategist',
    avatar_url: 'person 5.jpeg',
    skills_teach: 'Growth Marketing, SEO, Analytics, Copywriting',
    skills_learn: 'Python, SQL, Data Pipelines',
    project_interest: 'Growth Analytics Automation Suite',
    cadence: '2 sessions/week · 45 mins each',
    bio: 'Growth hacker helping tech founders turn product iterations into scalable user acquisition engines.'
  });

  addReview({
    reviewer_id: u3.id,
    reviewee_id: u4.id,
    rating: 5,
    review_text: 'I signed up for a single Python session and gained a brilliant mentor and lifelong collaborator.'
  });

  addReview({
    reviewer_id: u2.id,
    reviewee_id: u1.id,
    rating: 5,
    review_text: 'The swap was effortless from the very first greeting. We both walked away with tangible skills and working code.'
  });

  addReview({
    reviewer_id: u5.id,
    reviewee_id: u2.id,
    rating: 5,
    review_text: 'Khaled gave actionable, clear advice on Node.js backends that saved me weeks of trial and error!'
  });

  const conv1 = getOrCreateConversation(u1.id, u2.id);
  addMessage({
    conversation_id: conv1.id,
    sender_id: u1.id,
    text: 'I added the Figma case studies to our shared session board! Looking forward to reviewing motion graphics ideas with you.'
  });
  addMessage({
    conversation_id: conv1.id,
    sender_id: u2.id,
    text: 'Awesome! I prepared a few dynamic transition concepts in React. See you on Friday at 6:30 PM!'
  });

  createCommunityPost({
    user_id: u1.id,
    category: 'Design',
    title: '5 Principles for Building Modular Design Tokens in Figma',
    content: 'When starting a new design system, structure your tokens into Tier-1 (Global), Tier-2 (Semantic), and Tier-3 (Component-specific). This makes multi-brand theme switching seamless!',
    tags: 'Figma, DesignSystems, Tokens'
  });

  createCommunityPost({
    user_id: u3.id,
    category: 'Tech',
    title: 'Beginner-Friendly Roadmap to Python AsyncIO & WebSockets',
    content: 'If you are transitioning from synchronous Python scripts to real-time event loops, start with `asyncio.gather()` and understand non-blocking socket streams.',
    tags: 'Python, Async, Backend'
  });

  createCommunityPost({
    user_id: u4.id,
    category: 'Career',
    title: 'How Peer Skill Swapping Landed Me My Dream Creative Director Role',
    content: 'Trading skills directly with engineers gave me technical literacy that set me apart in portfolio reviews. Never underestimate the compounding power of 1-on-1 swaps!',
    tags: 'Career, Networking, Growth'
  });

  console.log('✅ SkillSwap database seeded successfully.');
}

try {
  seedDefaultData();
} catch (e) {
  console.error('Error during auto-seed:', e);
}


// -----------------------------------------------------------------
// Swipe Interactions & Featured Profiles
// -----------------------------------------------------------------

function recordSwipe({ swiper_id, target_id, direction }) {
  try {
    // Attempt to insert or ignore/replace (sqlite handle duplicates if any)
    try {
      db.prepare("INSERT INTO swipe_interactions (swiper_id, target_id, direction) VALUES (?, ?, ?)").run(swiper_id, target_id, direction || "right");
    } catch(err) {
      // If unique constraint fails, just ignore
    }
    
    if (direction === 'right') {
      const peerSwipe = db.prepare("SELECT direction FROM swipe_interactions WHERE swiper_id = ? AND target_id = ?").get(target_id, swiper_id);
      if (peerSwipe && peerSwipe.direction === 'right') {
        // MATCH!
        // Check if conversation exists
        let conv = db.prepare(`
          SELECT id FROM conversations 
          WHERE (participant1_id = ? AND participant2_id = ?) 
             OR (participant1_id = ? AND participant2_id = ?)
        `).get(swiper_id, target_id, target_id, swiper_id);
        
        let convId;
        if (!conv) {
          const res = db.prepare(`
            INSERT INTO conversations (participant1_id, participant2_id)
            VALUES (?, ?)
          `).run(swiper_id, target_id);
          convId = res.lastInsertRowid;
          
          // Send automatic system message!
          db.prepare(`
            INSERT INTO messages (conversation_id, sender_id, text)
            VALUES (?, ?, ?)
          `).run(convId, swiper_id, "? It's a match! We both swiped right on each other. When are you free to chat or share a Google Meet link?");
        } else {
          convId = conv.id;
        }
        
        return { success: true, isMatch: true, conversationId: convId };
      }
    }
    return { success: true, isMatch: false };
  } catch(e) { 
    console.error("recordSwipe error:", e);
    return { success: false }; 
  }
}

function getFeaturedProfiles(limit) {
  limit = limit || 6;
  const stmt = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.role_title, u.avatar_url,
      u.skills_teach, u.skills_learn, u.project_interest, u.bio,
      COUNT(si.id) as swipe_count,
      COUNT(CASE WHEN si.direction = 'right' THEN 1 END) as right_swipes,
      AVG(r.rating) as avg_rating,
      COUNT(DISTINCT r.id) as review_count
    FROM users u
    LEFT JOIN swipe_interactions si ON si.target_id = u.id
    LEFT JOIN reviews r ON r.reviewee_id = u.id
    GROUP BY u.id
    ORDER BY right_swipes DESC, avg_rating DESC, swipe_count DESC
    LIMIT ?
  `);
  const profiles = stmt.all(limit);
  return profiles.map(function(p) {
    return Object.assign({}, p, {
      avg_rating: p.avg_rating ? Number(Number(p.avg_rating).toFixed(1)) : null,
      swipe_count: p.swipe_count || 0,
      right_swipes: p.right_swipes || 0
    });
  });
}

function getSwipeStats(userId) {
  const r = db.prepare("SELECT COUNT(*) as c FROM swipe_interactions WHERE target_id = ? AND direction = ?").get(userId, "right");
  const t = db.prepare("SELECT COUNT(*) as c FROM swipe_interactions WHERE target_id = ?").get(userId);
  return { right_swipes: r ? r.c : 0, total_swipes: t ? t.c : 0 };
}

function getUserSwipeHistory(userId) {
  return db.prepare(`
    SELECT si.*, u.full_name as target_name, u.avatar_url as target_avatar, u.role_title as target_role
    FROM swipe_interactions si JOIN users u ON si.target_id = u.id
    WHERE si.swiper_id = ? ORDER BY si.id DESC LIMIT 50
  `).all(userId);
}

module.exports = {
  db,
  hashPassword,
  verifyPassword,
  generateSessionToken,
  verifySessionToken,
  createUser,
  getUserByEmail,
  getUserById,
  updateUserProfile,
  getAllUsers,
  addFavorite,
  removeFavorite,
  getUserFavorites,
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createProposal,
  getProposalById,
  getUserProposals,
  updateProposalStatus,
  getOrCreateConversation,
  getUserConversations,
  updateConversationMeet,
  addMessage,
  getConversationMessages,
  addReview,
  getReviewById,
  getAllReviews,
  getUserReviews,
  createSession,
  getSessionById,
  updateSession,
  deleteSession,
  getUserSessions,
  getCommunityPosts,
  createCommunityPost,
  togglePostLike,
  getPlatformStats,
  seedDefaultData,
  recordSwipe,
  getFeaturedProfiles,
  getSwipeStats,
  getUserSwipeHistory
};
