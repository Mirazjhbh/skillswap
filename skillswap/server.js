/**
 * SkillSwap Backend Server
 * High-performance RESTful API & Static Asset Server
 * Runs seamlessly on Node.js v24+ with zero external dependencies.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const db = require('./database');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

// Helper to send JSON responses
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  });
  res.end(JSON.stringify(data));
}

// Helper to parse JSON request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Body payload too large'));
      }
    });
    req.on('end', () => {
      try {
        if (!body.trim()) return resolve({});
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// Helper to authenticate request
function getAuthUser(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const tokenData = db.verifySessionToken(token);
  if (!tokenData || !tokenData.userId) return null;
  return db.getUserById(tokenData.userId);
}

// Create HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // CORS preflight handling
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
    res.end();
    return;
  }

  // -----------------------------------------------------------------
  // API ROUTING
  // -----------------------------------------------------------------
  if (pathname.startsWith('/api/')) {
    try {
      // 1. AUTHENTICATION ENDPOINTS
      if (pathname === '/api/auth/signup' && method === 'POST') {
        const body = await parseBody(req);
        const { email, password, full_name, role_title, skills_teach, skills_learn, avatar_url, bio } = body;

        if (!email || !password || !full_name) {
          return sendJson(res, 400, { ok: false, error: 'Name, email, and password are required.' });
        }

        const existing = db.getUserByEmail(email);
        if (existing) {
          return sendJson(res, 409, { ok: false, error: 'An account with this email already exists.' });
        }

        const user = db.createUser({
          email,
          password,
          full_name,
          role_title: role_title || 'Skill Swapper',
          skills_teach: skills_teach || '',
          skills_learn: skills_learn || '',
          avatar_url: avatar_url || 'default-avatar.svg',
          bio: bio || ''
        });

        const token = db.generateSessionToken(user);
        return sendJson(res, 201, { ok: true, user, token, message: 'Account created successfully!' });
      }

      if (pathname === '/api/auth/login' && method === 'POST') {
        const body = await parseBody(req);
        const { email, password } = body;

        if (!email || !password) {
          return sendJson(res, 400, { ok: false, error: 'Invalid email or password. Please try again.' });
        }

        const user = db.getUserByEmail(email);
        if (!user || !user.password_hash || !user.salt) {
          return sendJson(res, 401, { ok: false, error: 'Invalid email or password. Please try again.' });
        }

        const isValid = db.verifyPassword(password, user.password_hash, user.salt);
        if (!isValid) {
          return sendJson(res, 401, { ok: false, error: 'Invalid email or password. Please try again.' });
        }

        const fullUser = db.getUserById(user.id);
        const token = db.generateSessionToken(fullUser);
        return sendJson(res, 200, { ok: true, user: fullUser, token, message: 'Logged in successfully!' });
      }

      if (pathname === '/api/auth/google' && method === 'POST') {
        const body = await parseBody(req);
        const { email, full_name, google_id, avatar_url } = body;

        if (!email) {
          return sendJson(res, 400, { ok: false, error: 'Google email is required.' });
        }

        let user = db.getUserByEmail(email);
        if (!user) {
          user = db.createUser({
            email,
            password: null,
            full_name: full_name || email.split('@')[0],
            role_title: 'Skill Swapper',
            avatar_url: avatar_url || 'default-avatar.svg',
            google_id: google_id || `g_${Date.now()}`
          });
        }

        const fullUser = db.getUserById(user.id);
        const token = db.generateSessionToken(fullUser);
        return sendJson(res, 200, { ok: true, user: fullUser, token, message: 'Authenticated with Google!' });
      }

      if (pathname === '/api/auth/me' && method === 'GET') {
        const user = getAuthUser(req);
        if (!user) {
          return sendJson(res, 401, { ok: false, error: 'Unauthorized or session expired.' });
        }
        return sendJson(res, 200, { ok: true, user });
      }

      if (pathname === '/api/auth/logout' && method === 'POST') {
        return sendJson(res, 200, { ok: true, message: 'Logged out successfully.' });
      }

      // 2. USER PROFILE ENDPOINTS
      if (pathname === '/api/users' && method === 'GET') {
        const authUser = getAuthUser(req);
        const users = db.getAllUsers(authUser ? authUser.id : null);
        return sendJson(res, 200, { ok: true, users });
      }

      if (pathname === '/api/users/profile' && method === 'PUT') {
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Unauthorized' });

        const body = await parseBody(req);
        const updated = db.updateUserProfile(authUser.id, body);
        return sendJson(res, 200, { ok: true, user: updated, message: 'Profile updated successfully!' });
      }

      const userReviewsMatch = pathname.match(/^\/api\/users\/(\d+)\/reviews$/);
      if (userReviewsMatch && method === 'GET') {
        const targetId = parseInt(userReviewsMatch[1], 10);
        const reviews = db.getUserReviews(targetId);
        return sendJson(res, 200, { ok: true, reviews });
      }

      const userMatch = pathname.match(/^\/api\/users\/(\d+)$/);
      if (userMatch && method === 'GET') {
        const targetId = parseInt(userMatch[1], 10);
        const targetUser = db.getUserById(targetId);
        if (!targetUser) return sendJson(res, 404, { ok: false, error: 'User not found.' });
        return sendJson(res, 200, { ok: true, user: targetUser });
      }

      // 3. FAVORITES / BOOKMARKS
      if (pathname === '/api/favorites' && method === 'GET') {
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Unauthorized' });

        const favs = db.getUserFavorites(authUser.id);
        return sendJson(res, 200, { ok: true, favorites: favs });
      }

      const favoriteMatch = pathname.match(/^\/api\/favorites\/(\d+)$/);
      if (favoriteMatch) {
        const targetUserId = parseInt(favoriteMatch[1], 10);
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Unauthorized' });

        if (method === 'POST') {
          const success = db.addFavorite(authUser.id, targetUserId);
          return sendJson(res, 200, { ok: true, message: 'Saved to favorites' });
        }
        if (method === 'DELETE') {
          db.removeFavorite(authUser.id, targetUserId);
          return sendJson(res, 200, { ok: true, message: 'Removed from favorites' });
        }
      }

      // 4. MATCHING & DISCOVERY
      if (pathname === '/api/matches' && method === 'GET') {
        const authUser = getAuthUser(req);
        const allUsers = db.getAllUsers(authUser ? authUser.id : null);
        const otherUsers = authUser ? allUsers.filter(u => u.id !== authUser.id) : allUsers;

        const matched = otherUsers.map(peer => {
          let score = 65; // base score for registered peer
          let teachMatch = false;
          let learnMatch = false;

          if (authUser && authUser.skills_learn && peer.skills_teach) {
            const myLearns = authUser.skills_learn.toLowerCase().split(/[,·|]/).map(s => s.trim()).filter(Boolean);
            const peerTeaches = peer.skills_teach.toLowerCase().split(/[,·|]/).map(s => s.trim()).filter(Boolean);
            teachMatch = myLearns.some(ml => peerTeaches.some(pt => pt.includes(ml) || ml.includes(pt)));
            if (teachMatch) score += 20;
          }

          if (authUser && authUser.skills_teach && peer.skills_learn) {
            const myTeaches = authUser.skills_teach.toLowerCase().split(/[,·|]/).map(s => s.trim()).filter(Boolean);
            const peerLearns = peer.skills_learn.toLowerCase().split(/[,·|]/).map(s => s.trim()).filter(Boolean);
            learnMatch = myTeaches.some(mt => peerLearns.some(pl => pl.includes(mt) || mt.includes(pl)));
            if (learnMatch) score += 14;
          }

          return {
            ...peer,
            match_score: Math.min(99, score),
            is_reciprocal_match: teachMatch && learnMatch
          };
        }).sort((a, b) => b.match_score - a.match_score);

        return sendJson(res, 200, { ok: true, matches: matched });
      }

      // 5. PROPOSALS & EXCHANGE REQUESTS
      if (pathname === '/api/proposals' && method === 'POST') {
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Please log in to send a proposal.' });

        const body = await parseBody(req);
        const { receiver_id, learn_skill, teach_skill, message } = body;

        if (!receiver_id || !learn_skill || !teach_skill) {
          return sendJson(res, 400, { ok: false, error: 'Receiver, skill to learn, and skill to teach are required.' });
        }

        if (parseInt(receiver_id, 10) === authUser.id) {
          return sendJson(res, 400, { ok: false, error: 'You cannot send a proposal to yourself.' });
        }

        const proposal = db.createProposal({
          sender_id: authUser.id,
          receiver_id: parseInt(receiver_id, 10),
          learn_skill,
          teach_skill,
          message: message || ''
        });

        return sendJson(res, 201, { ok: true, proposal, message: 'Exchange proposal sent successfully!' });
      }

      if (pathname === '/api/proposals' && method === 'GET') {
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Unauthorized' });

        const proposals = db.getUserProposals(authUser.id);
        return sendJson(res, 200, { ok: true, proposals });
      }

      const proposalStatusMatch = pathname.match(/^\/api\/proposals\/(\d+)\/status$/);
      if (proposalStatusMatch && method === 'PUT') {
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Unauthorized' });

        const propId = parseInt(proposalStatusMatch[1], 10);
        const body = await parseBody(req);
        const { status } = body; // 'accepted' or 'rejected'

        if (!['accepted', 'rejected'].includes(status)) {
          return sendJson(res, 400, { ok: false, error: 'Invalid status' });
        }

        const proposal = db.getProposalById(propId);
        if (!proposal) return sendJson(res, 404, { ok: false, error: 'Proposal not found' });

        if (proposal.receiver_id !== authUser.id && proposal.sender_id !== authUser.id) {
          return sendJson(res, 403, { ok: false, error: 'Forbidden' });
        }

        const updated = db.updateProposalStatus(propId, status);
        return sendJson(res, 200, { ok: true, proposal: updated, message: `Proposal ${status}!` });
      }

      // 6. CONVERSATIONS & MESSAGES
      if (pathname === '/api/conversations' && method === 'GET') {
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Unauthorized' });

        const convs = db.getUserConversations(authUser.id);
        return sendJson(res, 200, { ok: true, conversations: convs });
      }

      const convMessagesMatch = pathname.match(/^\/api\/conversations\/(\d+)\/messages$/);
      if (convMessagesMatch) {
        const convId = parseInt(convMessagesMatch[1], 10);
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Unauthorized' });

        if (method === 'GET') {
          const messages = db.getConversationMessages(convId);
          return sendJson(res, 200, { ok: true, messages });
        }

        if (method === 'POST') {
          const body = await parseBody(req);
          const { text } = body;
          if (!text || !text.trim()) {
            return sendJson(res, 400, { ok: false, error: 'Message text cannot be empty.' });
          }

          const message = db.addMessage({
            conversation_id: convId,
            sender_id: authUser.id,
            text: text.trim()
          });

          return sendJson(res, 201, { ok: true, message });
        }
      }

      const convMeetMatch = pathname.match(/^\/api\/conversations\/(\d+)\/meet$/);
      if (convMeetMatch && method === 'PUT') {
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Unauthorized' });

        const convId = parseInt(convMeetMatch[1], 10);
        const body = await parseBody(req);
        const { meet_url } = body;

        if (!meet_url || !meet_url.trim()) {
          return sendJson(res, 400, { ok: false, error: 'Valid Google Meet URL required.' });
        }

        const updatedConv = db.updateConversationMeet(convId, meet_url.trim());

        db.addMessage({
          conversation_id: convId,
          sender_id: authUser.id,
          text: `📹 Shared Google Meet room: ${meet_url.trim()}`
        });

        return sendJson(res, 200, { ok: true, conversation: updatedConv, message: 'Google Meet link shared!' });
      }

      // 7. SESSIONS
      if (pathname === '/api/sessions' && method === 'GET') {
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Unauthorized' });

        const sessions = db.getUserSessions(authUser.id);
        return sendJson(res, 200, { ok: true, sessions });
      }

      if (pathname === '/api/sessions' && method === 'POST') {
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Unauthorized' });

        const body = await parseBody(req);
        const { participant_id, title, scheduled_time, meet_url, notes, conversation_id } = body;

        if (!participant_id || !title) {
          return sendJson(res, 400, { ok: false, error: 'Participant and title are required.' });
        }

        const session = db.createSession({
          conversation_id: conversation_id ? parseInt(conversation_id, 10) : null,
          title,
          host_id: authUser.id,
          participant_id: parseInt(participant_id, 10),
          scheduled_time: scheduled_time || 'Upcoming Session',
          meet_url: meet_url || 'https://meet.google.com/qmv-ytpk-zbw',
          notes: notes || ''
        });

        return sendJson(res, 201, { ok: true, session, message: 'Session scheduled successfully!' });
      }

      const sessionMatch = pathname.match(/^\/api\/sessions\/(\d+)$/);
      if (sessionMatch) {
        const sessionId = parseInt(sessionMatch[1], 10);
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Unauthorized' });

        if (method === 'PUT') {
          const body = await parseBody(req);
          const updated = db.updateSession(sessionId, body);
          return sendJson(res, 200, { ok: true, session: updated, message: 'Session updated!' });
        }

        if (method === 'DELETE') {
          db.deleteSession(sessionId);
          return sendJson(res, 200, { ok: true, message: 'Session cancelled.' });
        }
      }

      // 8. NOTIFICATIONS
      if (pathname === '/api/notifications' && method === 'GET') {
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Unauthorized' });

        const notifs = db.getUserNotifications(authUser.id);
        return sendJson(res, 200, { ok: true, notifications: notifs });
      }

      if (pathname === '/api/notifications/read-all' && method === 'PUT') {
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Unauthorized' });

        db.markAllNotificationsAsRead(authUser.id);
        return sendJson(res, 200, { ok: true, message: 'All notifications marked as read.' });
      }

      const notifReadMatch = pathname.match(/^\/api\/notifications\/(\d+)\/read$/);
      if (notifReadMatch && method === 'PUT') {
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Unauthorized' });

        const notifId = parseInt(notifReadMatch[1], 10);
        db.markNotificationAsRead(notifId, authUser.id);
        return sendJson(res, 200, { ok: true, message: 'Notification marked as read.' });
      }

      // 9. REVIEWS & RATINGS
      if (pathname === '/api/reviews' && method === 'GET') {
        const reviews = db.getAllReviews();
        return sendJson(res, 200, { ok: true, reviews });
      }

      if (pathname === '/api/reviews' && method === 'POST') {
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Please log in to submit a review.' });

        const body = await parseBody(req);
        const { reviewee_id, rating, review_text } = body;

        if (!reviewee_id || !rating || !review_text) {
          return sendJson(res, 400, { ok: false, error: 'Reviewee, rating (1-5), and review text are required.' });
        }

        const numericRating = parseInt(rating, 10);
        if (numericRating < 1 || numericRating > 5) {
          return sendJson(res, 400, { ok: false, error: 'Rating must be between 1 and 5 stars.' });
        }

        if (parseInt(reviewee_id, 10) === authUser.id) {
          return sendJson(res, 400, { ok: false, error: 'You cannot review yourself.' });
        }

        const review = db.addReview({
          reviewer_id: authUser.id,
          reviewee_id: parseInt(reviewee_id, 10),
          rating: numericRating,
          review_text: review_text.trim()
        });

        return sendJson(res, 201, { ok: true, review, message: 'Review & rating submitted successfully!' });
      }

      // 10. COMMUNITY POSTS / DISCUSSIONS
      if (pathname === '/api/community/posts' && method === 'GET') {
        const authUser = getAuthUser(req);
        const category = parsedUrl.searchParams.get('category');
        const posts = db.getCommunityPosts(authUser ? authUser.id : null, category);
        return sendJson(res, 200, { ok: true, posts });
      }

      if (pathname === '/api/community/posts' && method === 'POST') {
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Please log in to create a post.' });

        const body = await parseBody(req);
        const { title, content, category, tags } = body;

        if (!title || !content) {
          return sendJson(res, 400, { ok: false, error: 'Title and content are required.' });
        }

        const post = db.createCommunityPost({
          user_id: authUser.id,
          title,
          content,
          category: category || 'General',
          tags: tags || ''
        });

        return sendJson(res, 201, { ok: true, post, message: 'Community post published!' });
      }

      const postLikeMatch = pathname.match(/^\/api\/community\/posts\/(\d+)\/like$/);
      if (postLikeMatch && method === 'POST') {
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Unauthorized' });

        const postId = parseInt(postLikeMatch[1], 10);
        const result = db.togglePostLike(postId, authUser.id);
        return sendJson(res, 200, { ok: true, ...result });
      }

      // 11. PLATFORM STATS
      if (pathname === '/api/stats' && method === 'GET') {
        const stats = db.getPlatformStats();
        return sendJson(res, 200, { ok: true, stats });
      }

      // 12. DATABASE SEED UTILITY
      if (pathname === '/api/seed' && method === 'POST') {
        db.seedDefaultData();
        return sendJson(res, 200, { ok: true, message: 'Database initialized with verified community members.' });
      }

      // 13. SWIPE INTERACTIONS & FEATURED PROFILES
      if (pathname === '/api/swipe' && method === 'POST') {
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Please log in to swipe.' });
        const body = await parseBody(req);
        const { target_id, direction } = body;
        if (!target_id) return sendJson(res, 400, { ok: false, error: 'Target user ID required.' });
        if (parseInt(target_id, 10) === authUser.id) return sendJson(res, 400, { ok: false, error: 'Cannot swipe on yourself.' });
        db.recordSwipe({ swiper_id: authUser.id, target_id: parseInt(target_id, 10), direction: direction || 'right' });
        return sendJson(res, 200, { ok: true, message: 'Interaction recorded.' });
      }

      if (pathname === '/api/featured' && method === 'GET') {
        const limit = parseInt(parsedUrl.searchParams.get('limit') || '6', 10);
        const featured = db.getFeaturedProfiles(limit);
        return sendJson(res, 200, { ok: true, featured });
      }

      if (pathname === '/api/swipe/history' && method === 'GET') {
        const authUser = getAuthUser(req);
        if (!authUser) return sendJson(res, 401, { ok: false, error: 'Unauthorized' });
        const history = db.getUserSwipeHistory(authUser.id);
        return sendJson(res, 200, { ok: true, history });
      }

      // If no API route matched:
      return sendJson(res, 404, { ok: false, error: `API route ${method} ${pathname} not found.` });

    } catch (err) {
      console.error('API Error:', err);
      return sendJson(res, 500, { ok: false, error: err.message || 'Internal Server Error' });
    }
  }

  // -----------------------------------------------------------------
  // STATIC ASSET SERVING
  // -----------------------------------------------------------------
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(normalizedPath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SkillSwap Dynamic Server is running!`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📦 Database: SQLite (node:sqlite) initialized`);
  console.log(`====================================================`);
});

module.exports = server;
