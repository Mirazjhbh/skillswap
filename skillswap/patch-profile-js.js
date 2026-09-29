const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

let js = fs.readFileSync(path.join(dir, "scripts.js"), "utf8");

const oldGallery = `  if (avatarPickerGallery) {
    avatarPickerGallery.querySelectorAll('.avatar-pick-option').forEach(img => {
      img.addEventListener('click', () => {
        avatarPickerGallery.querySelectorAll('.avatar-pick-option').forEach(i => i.classList.remove('selected'));
        img.classList.add('selected');
        if (inputUserAvatar) inputUserAvatar.value = img.dataset.src;
      });
    });
  }`;

const newGallery = `  const avatarFile = document.querySelector('#input-avatar-file');
  const avatarPreview = document.querySelector('#avatar-preview-img');
  
  if (avatarFile) {
    avatarFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        if (avatarPreview) avatarPreview.src = dataUrl;
        if (inputUserAvatar) inputUserAvatar.value = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }`;

if (js.includes(oldGallery)) {
  js = js.replace(oldGallery, newGallery);
  console.log("Avatar file JS replaced!");
} else {
  // Regex fallback
  const regex = /if \(avatarPickerGallery\) \{[\s\S]*?\}\);\n  \}/m;
  if (regex.test(js)) {
    js = js.replace(regex, newGallery);
    console.log("Avatar file JS replaced via regex!");
  } else {
    console.log("Could not find gallery JS.");
  }
}

// Find form submission payload
const oldSubmitRegex = /const payload = \{[\s\S]*?cadence: inputCadence \? inputCadence\.value : 'Weekly'\n\s*\};/m;
const newSubmit = `const payload = {
        full_name: inputName ? inputName.value.trim() : '',
        avatar_url: inputUserAvatar ? inputUserAvatar.value : 'default-avatar.svg',
        role_title: inputRole ? inputRole.value.trim() : '',
        bio: inputBio ? inputBio.value.trim() : '',
        skills_learn: '',
        project_interest: '',
        skills_teach: '',
        cadence: 'Weekly'
      };`;

if (oldSubmitRegex.test(js)) {
  js = js.replace(oldSubmitRegex, newSubmit);
  console.log("Payload updated!");
} else {
  console.log("Could not find payload regex.");
}

// Populate logic update
const regexPopulate = /if \(!currentUser\) return;[\s\S]*?if \(inputTeach\) inputTeach\.value = currentUser\.skills_teach \|\| '';/m;
const newPopulate = `if (!currentUser) return;
      if (inputUserAvatar) {
        inputUserAvatar.value = currentUser.avatar_url || 'default-avatar.svg';
        const avatarPreview = document.querySelector('#avatar-preview-img');
        if (avatarPreview) avatarPreview.src = currentUser.avatar_url || 'default-avatar.svg';
      }
      if (inputName) inputName.value = currentUser.full_name || '';
      if (inputRole) inputRole.value = currentUser.role_title || '';
      if (inputBio) inputBio.value = currentUser.bio || '';`;

if (regexPopulate.test(js)) {
  js = js.replace(regexPopulate, newPopulate);
  console.log("Populate logic updated!");
} else {
  console.log("Could not find populate logic regex.");
}

fs.writeFileSync(path.join(dir, "scripts.js"), js, "utf8");
