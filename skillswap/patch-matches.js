const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

// 1. PATCH database.js
let dbJs = fs.readFileSync(path.join(dir, "database.js"), "utf8");

const oldRecordSwipe = `function recordSwipe({ swiper_id, target_id, direction }) {
  try {
    db.prepare("INSERT INTO swipe_interactions (swiper_id, target_id, direction) VALUES (?, ?, ?)").run(swiper_id, target_id, direction || "right");
    return true;
  } catch(e) { return false; }
}`;

const newRecordSwipe = `function recordSwipe({ swiper_id, target_id, direction }) {
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
        let conv = db.prepare(\`
          SELECT id FROM conversations 
          WHERE (participant1_id = ? AND participant2_id = ?) 
             OR (participant1_id = ? AND participant2_id = ?)
        \`).get(swiper_id, target_id, target_id, swiper_id);
        
        let convId;
        if (!conv) {
          const res = db.prepare(\`
            INSERT INTO conversations (participant1_id, participant2_id)
            VALUES (?, ?)
          \`).run(swiper_id, target_id);
          convId = res.lastInsertRowid;
          
          // Send automatic system message!
          db.prepare(\`
            INSERT INTO messages (conversation_id, sender_id, text)
            VALUES (?, ?, ?)
          \`).run(convId, swiper_id, "? It's a match! We both swiped right on each other. When are you free to chat or share a Google Meet link?");
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
}`;

if (dbJs.includes("INSERT INTO swipe_interactions")) {
  dbJs = dbJs.replace(oldRecordSwipe, newRecordSwipe);
  fs.writeFileSync(path.join(dir, "database.js"), dbJs, "utf8");
  console.log("database.js patched.");
}

// 2. PATCH server.js
let serverJs = fs.readFileSync(path.join(dir, "server.js"), "utf8");

const oldServerSwipe = `        if (pathname === '/api/swipe' && method === 'POST') {
          const authUser = getAuthUser(req);
          if (!authUser) return sendJson(res, 401, { ok: false, error: 'Please log in to swipe.' });
          const body = await parseBody(req);
          const { target_id, direction } = body;
          if (!target_id) return sendJson(res, 400, { ok: false, error: 'Target user ID required.' });
          if (parseInt(target_id, 10) === authUser.id) return sendJson(res, 400, { ok: false, error: 'Cannot swipe on yourself.' });
          db.recordSwipe({ swiper_id: authUser.id, target_id: parseInt(target_id, 10), direction: direction || 'right' });
          return sendJson(res, 200, { ok: true, message: 'Interaction recorded.' });
        }`;

const newServerSwipe = `        if (pathname === '/api/swipe' && method === 'POST') {
          const authUser = getAuthUser(req);
          if (!authUser) return sendJson(res, 401, { ok: false, error: 'Please log in to swipe.' });
          const body = await parseBody(req);
          const { target_id, direction } = body;
          if (!target_id) return sendJson(res, 400, { ok: false, error: 'Target user ID required.' });
          if (parseInt(target_id, 10) === authUser.id) return sendJson(res, 400, { ok: false, error: 'Cannot swipe on yourself.' });
          
          const result = db.recordSwipe({ swiper_id: authUser.id, target_id: parseInt(target_id, 10), direction: direction || 'right' });
          
          return sendJson(res, 200, { 
            ok: true, 
            message: 'Interaction recorded.',
            isMatch: result.isMatch,
            conversationId: result.conversationId
          });
        }`;

if (serverJs.includes("if (pathname === '/api/swipe' && method === 'POST') {")) {
  serverJs = serverJs.replace(oldServerSwipe, newServerSwipe);
  fs.writeFileSync(path.join(dir, "server.js"), serverJs, "utf8");
  console.log("server.js patched.");
}

// 3. PATCH scripts.js
let scriptsJs = fs.readFileSync(path.join(dir, "scripts.js"), "utf8");

const oldDoSwipe = `  function doSwipe(card, direction) {
    if (!requireAuth('swipe profiles')) { card.style.transform = ''; return; }
    const userId = card.dataset.userId;
    card.classList.add(direction === 'right' ? 'fly-right' : 'fly-left');
    setTimeout(() => {
      card.remove();
      currentSwipeIndex++;
      renderSwipeCards();
      if (direction === 'right') setTimeout(loadFeaturedProfiles, 600);
    }, 460);
    if (userId && currentUser) {
      api('/api/swipe', { method: 'POST', body: JSON.stringify({ target_id: parseInt(userId), direction }) });
    }
    if (direction === 'right') showToast('Connection interest recorded! ??', '?');
  }`;

const newDoSwipe = `  async function doSwipe(card, direction) {
    if (!requireAuth('swipe profiles')) { card.style.transform = ''; return; }
    const userId = card.dataset.userId;
    card.classList.add(direction === 'right' ? 'fly-right' : 'fly-left');
    
    setTimeout(() => {
      card.remove();
      currentSwipeIndex++;
      renderSwipeCards();
      if (direction === 'right') setTimeout(loadFeaturedProfiles, 600);
    }, 460);

    if (userId && currentUser) {
      const res = await api('/api/swipe', { method: 'POST', body: JSON.stringify({ target_id: parseInt(userId), direction }) });
      if (res && res.isMatch) {
        // Boom! It's a match!
        showToast('?? ITS A MATCH! A new chat has been created in Sessions.', '??');
        loadConversations();
        
        // Show match notification logic if we want a big alert
        const userName = card.querySelector('.swipe-card-name')?.textContent || 'this user';
        alert(\`It's a Match! You and \${userName.trim()} both swiped right. You can now message each other in the Sessions/Discussions tab!\`);
      } else if (direction === 'right') {
        showToast('Connection interest recorded! ??', '?');
      }
    }
  }`;

// Handle different versions of doSwipe just in case emoji encoding broke during previous writes
const doSwipeRegex = /function doSwipe\(card, direction\) \{[\s\S]*?Connection interest recorded!.*?;\n  \}/m;
if (doSwipeRegex.test(scriptsJs)) {
  scriptsJs = scriptsJs.replace(doSwipeRegex, newDoSwipe);
  fs.writeFileSync(path.join(dir, "scripts.js"), scriptsJs, "utf8");
  console.log("scripts.js patched for match logic.");
} else {
  console.log("doSwipe regex failed.");
}

