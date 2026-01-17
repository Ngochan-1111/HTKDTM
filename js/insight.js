async function loadInsight(intent) {
  try {
    if (!window.CURRENT_USER_ID) return;

    const res = await fetch(
      "https://tieunhi171.app.n8n.cloud/webhook/insight",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: window.CURRENT_USER_ID,
          intent
        })
      }
    );

    const raw = await res.json();
    const data = Array.isArray(raw) ? raw[0] : raw;

    console.log("INSIGHT DATA:", intent, data);

    /* ===== DAY ===== */
    if (intent === "DAY_TOTAL") {
      document.getElementById("dayIncome").innerText =
        (data.total_income ?? 0).toLocaleString() + " đ";

      document.getElementById("dayExpense").innerText =
        (data.total_expense ?? 0).toLocaleString() + " đ";

      if (data.insight_text) {
        document.getElementById("insightText").innerText =
          data.insight_text;
      }
    }

    /* ===== MONTH + SO SÁNH ===== */
    if (intent === "MONTH_TOTAL") {
      document.getElementById("monthIncome").innerText =
        (data.total_income ?? 0).toLocaleString() + " đ";

      document.getElementById("monthExpense").innerText =
        (data.total_expense ?? 0).toLocaleString() + " đ";

      const trendCard = document.getElementById("trendCard");
      const trendValue = document.getElementById("expenseTrendPercent");
      const trendText = document.getElementById("expenseTrendText");
      const levelEl = document.getElementById("expenseLevel");

      if (data.last_month_expense && data.last_month_expense > 0) {
        const ratio =
          data.total_expense / data.last_month_expense;

        trendValue.innerText = ratio.toFixed(1) + "x";
        trendText.innerText = data.insight_text || "";
        levelEl.innerText = data.level || "";

        trendCard.classList.remove("warning", "safe");

        if (data.level && data.level.includes("Cảnh báo")) {
          trendCard.classList.add("warning");
        } else {
          trendCard.classList.add("safe");
        }

        trendCard.style.display = "block";

        // Narrative ưu tiên MONTH
        if (data.insight_text) {
          document.getElementById("insightText").innerText =
            data.insight_text;
        }
      } else {
        trendCard.style.display = "none";
      }
    }

  } catch (err) {
    console.error("Insight error:", err);
  }
}
