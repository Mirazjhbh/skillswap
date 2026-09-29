const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

let js = fs.readFileSync(path.join(dir, "scripts.js"), "utf8");

const scrollSpyCode = `
  // -------------------------------------------------------------
  // SCROLL SPY FOR NAVIGATION
  // -------------------------------------------------------------
  const navLinks = document.querySelectorAll('.main-nav a');
  const sections = Array.from(navLinks).map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);

  const observerOptions = {
    root: null,
    rootMargin: '-50% 0px -50% 0px', // Trigger when section crosses the middle of viewport
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === \`#\${id}\`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // Also highlight Home on load if at top
  window.addEventListener('scroll', () => {
    if (window.scrollY < 100) {
      navLinks.forEach(link => link.classList.remove('active'));
      const homeLink = document.querySelector('.main-nav a[href="#home"]');
      if (homeLink) homeLink.classList.add('active');
    }
  });
`;

if (!js.includes("SCROLL SPY FOR NAVIGATION")) {
  // Insert before window.addEventListener('scroll', ... (Header scroll logic) or at the end of the init block
  const attachPoint = "// Header Scroll Effect";
  if (js.includes(attachPoint)) {
    js = js.replace(attachPoint, scrollSpyCode + "\n  " + attachPoint);
    fs.writeFileSync(path.join(dir, "scripts.js"), js, "utf8");
    console.log("Scroll Spy added.");
  } else {
    // Just append before the end of the DOMContentLoaded wrapper
    const endPoint = "checkInitialSession();";
    js = js.replace(endPoint, scrollSpyCode + "\n\n  " + endPoint);
    fs.writeFileSync(path.join(dir, "scripts.js"), js, "utf8");
    console.log("Scroll Spy added near end.");
  }
} else {
  console.log("Scroll Spy already exists.");
}

// Update CSS for nav links
let css = fs.readFileSync(path.join(dir, "styles.css"), "utf8");
if (!css.includes("color: var(--royal-blue) !important;")) {
  const cssInject = `
.main-nav a.active {
  color: var(--royal-blue) !important;
}
[data-theme="dark"] .main-nav a {
  color: #ffffff; /* White by default in dark mode */
}
[data-theme="dark"] .main-nav a.active {
  color: var(--royal-blue) !important;
}
`;
  fs.appendFileSync(path.join(dir, "styles.css"), cssInject, "utf8");
  console.log("Nav CSS patched.");
}
