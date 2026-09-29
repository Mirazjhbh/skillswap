const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

let html = fs.readFileSync(path.join(dir, "index.html"), "utf8");

const oldFormRegex = /<form id="learning-goals-form" class="goals-form">[\s\S]*?<\/form>/m;

const newForm = `<form id="learning-goals-form" class="goals-form">
            <label style="display:flex; flex-direction:column; gap:10px; align-items:flex-start;">
              <span>Profile Picture:</span>
              <div style="display:flex; align-items:center; gap: 15px;">
                <img id="avatar-preview-img" src="default-avatar.svg" alt="Preview" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 2px solid var(--line);" />
                <input type="file" id="input-avatar-file" accept="image/*" style="font-size: 13px;" />
              </div>
              <input type="hidden" id="input-user-avatar" value="" />
            </label>
  
            <label for="input-user-fullname">
              Full Name:
              <input type="text" id="input-user-fullname" required placeholder="e.g. Alex Chen" />
            </label>
  
            <label for="input-user-role">
              Professional Title:
              <input type="text" id="input-user-role" placeholder="e.g. Full-Stack Developer" />
            </label>

            <label for="input-user-bio">
              Short Bio:
              <textarea id="input-user-bio" rows="2" placeholder="Tell peers about your background..."></textarea>
            </label>
  
            <button class="button button-primary" type="submit" style="margin-top: 10px;">Save Profile Updates</button>
          </form>`;

if (oldFormRegex.test(html)) {
  html = html.replace(oldFormRegex, newForm);
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
  console.log("HTML Profile form patched.");
} else {
  console.log("Regex for profile form failed.");
}

// Now patch scripts.js to handle the file upload and update the fields mapping
let js = fs.readFileSync(path.join(dir, "scripts.js"), "utf8");

// Remove avatar picker logic
const pickerRegex = /if \(avatarPicker\) \{[\s\S]*?\}\n  \}/m;
if (pickerRegex.test(js)) {
  js = js.replace(pickerRegex, `
  const avatarFile = document.querySelector('#input-avatar-file');
  const avatarPreview = document.querySelector('#avatar-preview-img');
  const avatarHidden = document.querySelector('#input-user-avatar');
  
  if (avatarFile) {
    avatarFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        if (avatarPreview) avatarPreview.src = dataUrl;
        if (avatarHidden) avatarHidden.value = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }
  `);
  console.log("JS Avatar logic replaced.");
} else {
  console.log("Could not find avatar picker logic in JS.");
}

// Update populate goals form to use new fields
const oldPopulate = `if (inputAvatar) {
        inputAvatar.value = currentUser.avatar_url || 'saif.jpg';
        const opts = document.querySelectorAll('.avatar-pick-option');
        opts.forEach(o => {
          if (o.dataset.src === inputAvatar.value) o.classList.add('selected');
          else o.classList.remove('selected');
        });
      }
      if (inputName) inputName.value = currentUser.full_name || '';
      if (inputRole) inputRole.value = currentUser.role_title || '';
      if (inputBio) inputBio.value = currentUser.bio || '';
      if (inputLearn) inputLearn.value = currentUser.skills_learn || '';
      if (inputProject) inputProject.value = currentUser.project_interest || '';
      if (inputTeach) inputTeach.value = currentUser.skills_teach || '';`;

const newPopulate = `if (inputAvatar) {
        inputAvatar.value = currentUser.avatar_url || 'default-avatar.svg';
        const avatarPreview = document.querySelector('#avatar-preview-img');
        if (avatarPreview) avatarPreview.src = currentUser.avatar_url || 'default-avatar.svg';
      }
      if (inputName) inputName.value = currentUser.full_name || '';
      if (inputRole) inputRole.value = currentUser.role_title || '';
      if (inputBio) inputBio.value = currentUser.bio || '';`;

if (js.includes("if (inputAvatar) {")) {
  js = js.replace(oldPopulate, newPopulate);
  console.log("JS populate form updated.");
} else {
  console.log("Could not find populate form logic in JS.");
}

// Update form submission payload
const oldSubmit = `const payload = {
        full_name: inputName ? inputName.value.trim() : '',
        avatar_url: inputAvatar ? inputAvatar.value : 'saif.jpg',
        role_title: inputRole ? inputRole.value.trim() : '',
        bio: inputBio ? inputBio.value.trim() : '',
        skills_learn: inputLearn ? inputLearn.value.trim() : '',
        project_interest: inputProject ? inputProject.value.trim() : '',
        skills_teach: inputTeach ? inputTeach.value.trim() : '',
        cadence: inputCadence ? inputCadence.value : 'Weekly'
      };`;

const newSubmit = `const payload = {
        full_name: inputName ? inputName.value.trim() : '',
        avatar_url: inputAvatar ? inputAvatar.value : 'default-avatar.svg',
        role_title: inputRole ? inputRole.value.trim() : '',
        bio: inputBio ? inputBio.value.trim() : '',
        skills_learn: '',
        project_interest: '',
        skills_teach: '',
        cadence: 'Weekly'
      };`;

if (js.includes("const payload = {")) {
  js = js.replace(oldSubmit, newSubmit);
  console.log("JS submit form updated.");
} else {
  console.log("Could not find submit form logic in JS.");
}

fs.writeFileSync(path.join(dir, "scripts.js"), js, "utf8");

