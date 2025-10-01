document.addEventListener('DOMContentLoaded', function() {
  const newPostBtn = document.querySelector('.new-post-btn');
  if (!newPostBtn) return;

  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;

  // Get the original URL from the button
  let originalUrl = newPostBtn.getAttribute('href');

  // Replace placeholders with the current date
  let updatedUrl = originalUrl.replace(/YYYY-MM-DD/g, formattedDate);

  // Update the button's href attribute
  newPostBtn.setAttribute('href', updatedUrl);
});
