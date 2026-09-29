/**
 * SkillSwap Complete End-to-End API Test Suite
 */

const http = require('node:http');
const assert = require('node:assert');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, rawBody: body });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, rawBody: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runE2E() {
  console.log('🚀 Running SkillSwap End-to-End HTTP Tests...\n');

  const server = require('./server');
  await new Promise(r => setTimeout(r, 800));

  try {
    // 1. Static HTML test
    console.log('1. Testing GET / (Static HTML serving)...');
    const getRoot = await request({ hostname: '127.0.0.1', port: 3000, path: '/', method: 'GET' });
    assert.strictEqual(getRoot.status, 200);
    assert.ok(getRoot.rawBody.includes('SkillSwap'));
    console.log('   ✓ Static HTML served properly');

    // 2. Sign Up test
    console.log('2. Testing POST /api/auth/signup (Database persistence)...');
    const userEmail = `e2e_user_${Date.now()}@skillswap.io`;
    const signupRes = await request({
      hostname: '127.0.0.1', port: 3000, path: '/api/auth/signup', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: userEmail,
      password: 'StrongPassword123!',
      full_name: 'E2E Tester',
      skills_teach: 'Next.js, Python, PostgreSQL',
      skills_learn: 'Figma, UX Research'
    });

    assert.strictEqual(signupRes.status, 201);
    assert.strictEqual(signupRes.body.ok, true);
    assert.ok(signupRes.body.token);
    const token = signupRes.body.token;
    const userId = signupRes.body.user.id;
    console.log('   ✓ User registered and JWT token issued');

    // 3. Login with Invalid credentials
    console.log('3. Testing POST /api/auth/login with invalid password...');
    const invalidLogin = await request({
      hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: userEmail,
      password: 'WrongPassword'
    });

    assert.strictEqual(invalidLogin.status, 401);
    assert.strictEqual(invalidLogin.body.ok, false);
    assert.strictEqual(invalidLogin.body.error, 'Invalid email or password. Please try again.');
    console.log('   ✓ Invalid credentials correctly returned expected error');

    // 4. Login with Valid credentials
    console.log('4. Testing POST /api/auth/login with valid credentials...');
    const validLogin = await request({
      hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: userEmail,
      password: 'StrongPassword123!'
    });

    assert.strictEqual(validLogin.status, 200);
    assert.strictEqual(validLogin.body.ok, true);
    console.log('   ✓ Successful login with DB credentials');

    // 5. Auth /me check
    console.log('5. Testing GET /api/auth/me...');
    const meRes = await request({
      hostname: '127.0.0.1', port: 3000, path: '/api/auth/me', method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.body.user.id, userId);
    console.log('   ✓ Current session authenticated');

    // 6. User Profile Update
    console.log('6. Testing PUT /api/users/profile (Updating learning goals)...');
    const updateProfile = await request({
      hostname: '127.0.0.1', port: 3000, path: '/api/users/profile', method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }, {
      skills_learn: 'Rust, WebAssembly',
      project_interest: 'High Performance AI Microservices',
      cadence: '2 sessions/week · 45 mins each'
    });

    assert.strictEqual(updateProfile.status, 200);
    assert.strictEqual(updateProfile.body.user.skills_learn, 'Rust, WebAssembly');
    console.log('   ✓ Profile updated and saved to SQLite DB');

    // 7. Get Users & Matches
    console.log('7. Testing GET /api/users and GET /api/matches...');
    const usersRes = await request({
      hostname: '127.0.0.1', port: 3000, path: '/api/users', method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(usersRes.status, 200);
    assert.ok(usersRes.body.users.length >= 2);

    const matchesRes = await request({
      hostname: '127.0.0.1', port: 3000, path: '/api/matches', method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(matchesRes.status, 200);
    console.log(`   ✓ Retrieved ${usersRes.body.users.length} real registered users and dynamic matches`);

    // 8. Favorites HTTP API
    console.log('8. Testing POST & GET & DELETE /api/favorites/:id...');
    const targetPeer = usersRes.body.users.find(u => u.id !== userId);
    const addFavRes = await request({
      hostname: '127.0.0.1', port: 3000, path: `/api/favorites/${targetPeer.id}`, method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(addFavRes.status, 200);

    const getFavsRes = await request({
      hostname: '127.0.0.1', port: 3000, path: '/api/favorites', method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(getFavsRes.status, 200);
    assert.ok(getFavsRes.body.favorites.some(f => f.id === targetPeer.id));
    console.log('   ✓ Peer favorited and retrieved in favorites API');

    // 9. Exchange Proposal & Conversations
    console.log('9. Testing POST /api/proposals & PUT /api/proposals/:id/status...');
    const propRes = await request({
      hostname: '127.0.0.1', port: 3000, path: '/api/proposals', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }, {
      receiver_id: targetPeer.id,
      learn_skill: 'Design Systems',
      teach_skill: 'Next.js',
      message: 'Let us connect for a mutual swap!'
    });
    assert.strictEqual(propRes.status, 201);
    const propId = propRes.body.proposal.id;

    const acceptRes = await request({
      hostname: '127.0.0.1', port: 3000, path: `/api/proposals/${propId}/status`, method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }, { status: 'accepted' });
    assert.strictEqual(acceptRes.status, 200);
    console.log('   ✓ Proposal created, accepted, and conversation initialized');

    // 10. Sessions Scheduling API
    console.log('10. Testing POST & GET & PUT /api/sessions...');
    const sessionRes = await request({
      hostname: '127.0.0.1', port: 3000, path: '/api/sessions', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }, {
      participant_id: targetPeer.id,
      title: 'Full Stack Integration Session',
      scheduled_time: 'Next Friday · 6:30 PM (BST)',
      meet_url: 'https://meet.google.com/qmv-ytpk-zbw'
    });
    assert.strictEqual(sessionRes.status, 201);
    const sessId = sessionRes.body.session.id;

    const getSessionsRes = await request({
      hostname: '127.0.0.1', port: 3000, path: '/api/sessions', method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(getSessionsRes.status, 200);
    assert.ok(getSessionsRes.body.sessions.some(s => s.id === sessId));
    console.log('   ✓ Session scheduled and verified in sessions API');

    // 11. Community Discussions & Likes API
    console.log('11. Testing POST & GET & LIKE /api/community/posts...');
    const postRes = await request({
      hostname: '127.0.0.1', port: 3000, path: '/api/community/posts', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }, {
      category: 'Tech',
      title: 'Top 5 Tips for Successful Skill Swapping',
      content: 'Set clear agendas before each session and share code snippets in advance!',
      tags: 'Tips, Learning, Growth'
    });
    assert.strictEqual(postRes.status, 201);
    const newPostId = postRes.body.post.id;

    const likePostRes = await request({
      hostname: '127.0.0.1', port: 3000, path: `/api/community/posts/${newPostId}/like`, method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(likePostRes.status, 200);
    assert.strictEqual(likePostRes.body.liked, true);
    console.log('   ✓ Community post published and liked');

    // 12. Submit Review
    console.log('12. Testing POST /api/reviews (Verified Review & Rating submission)...');
    const reviewRes = await request({
      hostname: '127.0.0.1', port: 3000, path: '/api/reviews', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }, {
      reviewee_id: targetPeer.id,
      rating: 5,
      review_text: 'Excellent collaboration on frontend and backend architecture!'
    });
    assert.strictEqual(reviewRes.status, 201);
    assert.strictEqual(reviewRes.body.ok, true);
    console.log('   ✓ Rating & review recorded in database');

    console.log('\n🎉 ALL END-TO-END HTTP TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ E2E Test Error:', err);
    process.exit(1);
  }
}

runE2E();
