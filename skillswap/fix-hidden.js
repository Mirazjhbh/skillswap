const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

let js = fs.readFileSync(path.join(dir, "scripts.js"), "utf8");

// Change .hidden = true/false to .style.display = 'none'/'flex'

const oldTrue = `      if (fieldSignupName) fieldSignupName.hidden = true;
      if (fieldSignupSkill) fieldSignupSkill.hidden = true;
      if (passStrengthMeter) passStrengthMeter.hidden = true;`;
const newTrue = `      if (fieldSignupName) fieldSignupName.style.display = 'none';
      if (fieldSignupSkill) fieldSignupSkill.style.display = 'none';
      if (passStrengthMeter) passStrengthMeter.style.display = 'none';`;

const oldFalse = `      if (fieldSignupName) fieldSignupName.hidden = false;
      if (fieldSignupSkill) fieldSignupSkill.hidden = false;
      if (passStrengthMeter) passStrengthMeter.hidden = false;`;
const newFalse = `      if (fieldSignupName) fieldSignupName.style.display = 'flex';
      if (fieldSignupSkill) fieldSignupSkill.style.display = 'flex';
      if (passStrengthMeter) passStrengthMeter.style.display = 'block';`;

js = js.replace(oldTrue, newTrue);
js = js.replace(oldFalse, newFalse);

fs.writeFileSync(path.join(dir, "scripts.js"), js, "utf8");
console.log("Visibility fixed.");
