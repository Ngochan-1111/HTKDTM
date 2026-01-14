
function afterSubmit() {
  setTimeout(() => {
    alert("✅ Đã lưu giao dịch");
    document.getElementById("transactionForm").reset();
  }, 300);
}
