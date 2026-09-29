/**
 * SkillSwap Comprehensive Backend & Database Integration Tests
 */

const assert = require('node:assert');
const db = require('./database');

console.log('🧪 Starting SkillSwap Backend & Database Tests...\n');

async function runTests() {
  try {
    // 1. User Registration & Auth
    console.log('1. Testing User Registration & Password Hashing...');
    const testEmail = `tester_${Date.now()}@skillswap.io`;
    const userA = db.createUser({
      email: testEmail,
      password: 'SecurePassword123!',
      full_name: 'Alex Developer',
      role_title: 'Full Stack Engineer',
      skills_teach: 'Node.js, React, TypeScript',
      skills_learn: 'UI/UX Design, Figma',
      project_interest: 'Building SkillSwap platform',
      bio: 'Software engineer building web apps.'
    });

    assert.ok(userA.id, 'User ID should be generated');
    assert.strictEqual(userA.email, testEmail.toLowerCase());
    console.log('   ✓ User registered successfully: ID', userA.id);

    // 2. Password Verification
    console.log('2. Testing Password Verification...');
    const userFromDb = db.getUserByEmail(testEmail);
    const validPass = db.verifyPassword('SecurePassword123!', userFromDb.password_hash, userFromDb.salt);
    const invalidPass = db.verifyPassword('WrongPassword', userFromDb.password_hash, userFromDb.salt);
    assert.strictEqual(validPass, true, 'Valid password must verify');
    assert.strictEqual(invalidPass, false, 'Invalid password must fail');
    console.log('   ✓ Password hashing & verification work as expected');

    // 3. JWT Session Token
    console.log('3. Testing JWT Session Token Generation & Verification...');
    const token = db.generateSessionToken(userA);
    const decoded = db.verifySessionToken(token);
    assert.ok(decoded, 'Token should decode successfully');
    assert.strictEqual(decoded.userId, userA.id);
    console.log('   ✓ Session token created and validated');

    // 4. Second User & Profile Update
    console.log('4. Testing Second User & Profile Update...');
    const userB = db.createUser({
      email: `designer_${Date.now()}@skillswap.io`,
      password: 'password123',
      full_name: 'Sadia Designer',
      role_title: 'Lead UI/UX Designer',
      skills_teach: 'Figma, Design Systems, UI/UX Design',
      skills_learn: 'React, Node.js',
      avatar_url: 'mim.jpg'
    });

    const updatedUserA = db.updateUserProfile(userA.id, {
      bio: 'Updated bio for Alex developer.',
      skills_teach: 'Node.js, React, SQLite, Architecture'
    });
    assert.strictEqual(updatedUserA.bio, 'Updated bio for Alex developer.');
    console.log('   ✓ Second user created & profile updated in DB');

    // 5. Favorites / Bookmarks
    console.log('5. Testing Favorites / Peer Bookmarking...');
    const favAdded = db.addFavorite(userA.id, userB.id);
    assert.strictEqual(favAdded, true, 'Favorite should be added');
    const userAFavs = db.getUserFavorites(userA.id);
    assert.ok(userAFavs.some(f => f.id === userB.id), 'User B should be in favorites list');
    db.removeFavorite(userA.id, userB.id);
    const favsAfterRemoval = db.getUserFavorites(userA.id);
    assert.ok(!favsAfterRemoval.some(f => f.id === userB.id), 'User B should be removed from favorites');
    console.log('   ✓ Favorites added, retrieved, and removed cleanly');

    // 6. Exchange Proposal & Notifications
    console.log('6. Testing Exchange Proposal Flow & Notification generation...');
    const proposal = db.createProposal({
      sender_id: userA.id,
      receiver_id: userB.id,
      learn_skill: 'Design Systems',
      teach_skill: 'Node.js Architecture',
      message: 'Would love to trade Figma tokens coaching for backend architecture!'
    });
    assert.ok(proposal.id, 'Proposal should be created');
    assert.strictEqual(proposal.status, 'pending');

    const notifsB = db.getUserNotifications(userB.id);
    assert.ok(notifsB.some(n => n.type === 'proposal_received'), 'Receiver should have proposal notification');

    const acceptedProposal = db.updateProposalStatus(proposal.id, 'accepted');
    assert.strictEqual(acceptedProposal.status, 'accepted');
    console.log('   ✓ Proposal sent, accepted, and automated notifications created');

    // 7. Conversations, Messages & Meet Link
    console.log('7. Testing Conversations & Real Messenger...');
    const convs = db.getUserConversations(userA.id);
    assert.ok(convs.length > 0, 'User should have an active conversation');
    const convId = convs[0].id;

    const msg = db.addMessage({
      conversation_id: convId,
      sender_id: userA.id,
      text: 'Hi Sadia! Looking forward to our Friday session.'
    });
    assert.ok(msg.id, 'Message should be saved');

    const updatedMeet = 'https://meet.google.com/test-meet-room';
    db.updateConversationMeet(convId, updatedMeet);
    const chatMsgs = db.getConversationMessages(convId);
    assert.ok(chatMsgs.length >= 2, 'Chat should have greeting and message');
    console.log(`   ✓ Conversation verified (${chatMsgs.length} messages) and Google Meet URL updated`);

    // 8. Sessions Scheduling
    console.log('8. Testing Sessions Creation & Rescheduling...');
    const session = db.createSession({
      conversation_id: convId,
      title: 'Figma to React Code Integration',
      host_id: userA.id,
      participant_id: userB.id,
      scheduled_time: 'Next Tuesday · 7:00 PM',
      meet_url: updatedMeet,
      notes: 'Reviewing component tokens'
    });
    assert.ok(session.id, 'Session should be created in DB');

    const userSessions = db.getUserSessions(userA.id);
    assert.ok(userSessions.some(s => s.id === session.id), 'Created session should appear in user sessions');

    db.updateSession(session.id, { status: 'completed' });
    const updatedSess = db.getSessionById(session.id);
    assert.strictEqual(updatedSess.status, 'completed');
    console.log('   ✓ Session scheduled, retrieved, and status updated');

    // 9. Community Posts & Likes
    console.log('9. Testing Community Discussions & Likes...');
    const post = db.createCommunityPost({
      user_id: userA.id,
      category: 'Tech',
      title: 'How to structure SQLite in Node 24',
      content: 'Node.js DatabaseSync provides native, ultra-fast SQLite without node-gyp build steps.',
      tags: 'NodeJS, SQLite, Performance'
    });
    assert.ok(post.id, 'Community post should be created');

    const likeResult = db.togglePostLike(post.id, userB.id);
    assert.strictEqual(likeResult.liked, true, 'User B liked post');
    const posts = db.getCommunityPosts(userB.id);
    const targetPost = posts.find(p => p.id === post.id);
    assert.strictEqual(targetPost.likes_count, 1);
    assert.strictEqual(targetPost.has_liked, true);
    console.log('   ✓ Community post published and dynamic like registered');

    // 10. Reviews & Platform Dynamic Stats
    console.log('10. Testing Reviews & Community Stats...');
    const review = db.addReview({
      reviewer_id: userA.id,
      reviewee_id: userB.id,
      rating: 5,
      review_text: 'Outstanding mentor and collaborator!'
    });
    assert.ok(review.id, 'Review should be recorded');

    const userBProfile = db.getUserById(userB.id);
    assert.strictEqual(userBProfile.avg_rating, 5);

    const stats = db.getPlatformStats();
    assert.ok(stats.total_users >= 2);
    assert.ok(stats.total_exchanges >= 1);
    assert.ok(stats.total_sessions >= 1);
    console.log('   ✓ Platform stats:', JSON.stringify(stats));

    console.log('\n🎉 ALL BACKEND & DATABASE TESTS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('\n❌ Test Failure:', err);
    process.exit(1);
  }
}

runTests();
