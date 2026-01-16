function showSection(id, el) {
  // Ẩn tất cả section
  document.querySelectorAll(".section").forEach(s => {
    s.style.display = "none";
  });

  // Hiện section được chọn
  document.getElementById(id).style.display = "block";

  // Active menu
  document.querySelectorAll(".sidebar nav a").forEach(a => {
    a.classList.remove("active");
  });
  el.classList.add("active");
}
