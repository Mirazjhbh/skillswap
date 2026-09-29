const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

let js = fs.readFileSync(path.join(dir, "scripts.js"), "utf8");

const regex = /const handleGuest = async \(\) => \{[\s\S]*?\};\n    if \(gwDemoBtn\) gwDemoBtn\.addEventListener\('click', handleGuest\);/m;

const replacement = `const handleGuest = (e) => {
      if (e) e.preventDefault();
      unlockWebsiteAccessAsGuest();
    };
    if (gwDemoBtn) gwDemoBtn.addEventListener('click', handleGuest);`;

if (regex.test(js)) {
  js = js.replace(regex, replacement);
  console.log("handleGuest patched.");
} else {
  console.log("handleGuest not found.");
}

fs.writeFileSync(path.join(dir, "scripts.js"), js, "utf8");
