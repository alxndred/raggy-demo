// Placeholder JavaScript – runs on every page.
const btn = document.getElementById("hello-btn");
const msg = document.getElementById("hello-msg");

if (btn && msg) {
  btn.addEventListener("click", () => {
    msg.textContent = "Hello! JavaScript is working.";
  });
}
