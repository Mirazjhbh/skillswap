const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

let js = fs.readFileSync(path.join(dir, "scripts.js"), "utf8");

const oldSubmitBlock = `  goalsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const full_name = document.querySelector('#input-user-fullname')?.value.trim() || currentUser.full_name;
      const role_title = document.querySelector('#input-user-role')?.value.trim() || 'Skill Swapper';
      const bio = document.querySelector('#input-user-bio')?.value.trim() || '';
      const avatar_url = inputUserAvatar ? inputUserAvatar.value : 'saif.jpg';
      const skills_learn = document.querySelector('#input-user-learning')?.value.trim() || '';
      const project_interest = document.querySelector('#input-user-project')?.value.trim() || '';
      const skills_teach = document.querySelector('#input-user-teach')?.value.trim() || '';
      const cadence = document.querySelector('#input-user-cadence')?.value || 'Weekly Google Meet Sessions';`;

const newSubmitBlock = `  goalsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const full_name = document.querySelector('#input-user-fullname')?.value.trim() || currentUser.full_name;
      const role_title = document.querySelector('#input-user-role')?.value.trim() || 'Skill Swapper';
      const bio = document.querySelector('#input-user-bio')?.value.trim() || '';
      const avatar_url = inputUserAvatar ? inputUserAvatar.value : 'default-avatar.svg';
      const skills_learn = '';
      const project_interest = '';
      const skills_teach = '';
      const cadence = 'Weekly Google Meet Sessions';`;

if (js.includes("const avatar_url = inputUserAvatar ? inputUserAvatar.value : 'saif.jpg';")) {
  js = js.replace(oldSubmitBlock, newSubmitBlock);
  console.log("Goals submit patched!");
} else {
  // Try regex
  const rx = /goalsForm\.addEventListener\('submit', async \(e\) => \{[\s\S]*?const cadence = document\.querySelector\('#input-user-cadence'\)\?\.value \|\| 'Weekly Google Meet Sessions';/m;
  if (rx.test(js)) {
    js = js.replace(rx, newSubmitBlock);
    console.log("Goals submit patched via regex!");
  }
}

// And update updateGoalsDisplay to remove the missing fields gracefully
const oldUpdate = `  function updateGoalsDisplay(goals) {
    if (!goals) return;
    const nameEl = document.querySelector('#my-profile-name');
    const roleEl = document.querySelector('#my-profile-role');
    const bioEl = document.querySelector('#my-profile-bio');
    const avatarEl = document.querySelector('#my-profile-avatar-img');
    const badgeEl = document.querySelector('#my-profile-avatar-badge');
    const headerAvatar = document.querySelector('#header-user-avatar');

    if (nameEl) nameEl.textContent = goals.fullname;
    if (roleEl) roleEl.textContent = goals.role;
    if (bioEl) bioEl.textContent = goals.bio || 'Add a short bio to tell peers about yourself...';
    if (avatarEl && goals.avatar) avatarEl.src = goals.avatar;
    if (badgeEl && goals.avatar) badgeEl.src = goals.avatar;
    if (headerAvatar && goals.avatar) headerAvatar.src = goals.avatar;

    const learnList = document.querySelector('#my-profile-learn-list');
    if (learnList) {
      learnList.innerHTML = '';
      (goals.learning || '').split(',').forEach(item => {
        if (item.trim()) {
          const li = document.createElement('li');
          li.textContent = item.trim();
          learnList.appendChild(li);
        }
      });
    }

    const teachList = document.querySelector('#my-profile-teach-list');
    if (teachList) {
      teachList.innerHTML = '';
      (goals.teach || '').split(',').forEach(item => {
        if (item.trim()) {
          const li = document.createElement('li');
          li.innerHTML = \`<span class="pill">\${escapeHtml(item.trim())}</span>\`;
          teachList.appendChild(li);
        }
      });
    }
  }`;

const newUpdate = `  function updateGoalsDisplay(goals) {
    if (!goals) return;
    const nameEl = document.querySelector('#my-profile-name');
    const roleEl = document.querySelector('#my-profile-role');
    const bioEl = document.querySelector('#my-profile-bio');
    const avatarEl = document.querySelector('#my-profile-avatar-img');
    const badgeEl = document.querySelector('#my-profile-avatar-badge');
    const headerAvatar = document.querySelector('#header-user-avatar');

    if (nameEl) nameEl.textContent = goals.fullname;
    if (roleEl) roleEl.textContent = goals.role;
    if (bioEl) bioEl.textContent = goals.bio || 'Add a short bio to tell peers about yourself...';
    
    const finalAvatar = goals.avatar || 'default-avatar.svg';
    if (avatarEl) avatarEl.src = finalAvatar;
    if (badgeEl) badgeEl.src = finalAvatar;
    if (headerAvatar) headerAvatar.src = finalAvatar;
  }`;

const updateRegex = /function updateGoalsDisplay\(goals\) \{[\s\S]*?teachList\.appendChild\(li\);\n\s*\}\n\s*\}\);\n\s*\}\n\s*\}/m;
if (updateRegex.test(js)) {
  js = js.replace(updateRegex, newUpdate);
  console.log("updateGoalsDisplay patched!");
}

fs.writeFileSync(path.join(dir, "scripts.js"), js, "utf8");
