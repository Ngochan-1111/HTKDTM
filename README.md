# HTKDTM
Ứng dụng quản lý chi tiêu thông minh – môn Hệ thống Kinh doanh Thông minh
# Luồng của em Huệ
transactions_clean
        ↓
     DATA_CHI   ← (Phần 1)
        ↓
 TONG_HOP_CHI   ← (Phần 2)
        ↓
 TV4_BASIC / INSIGHT ← (Phần 3)
        ↓
 Dify / Chatbot / Dashboard
 Google Sheets (DATA_CHI, ANOMALY, INSIGHT)
        ↓ (trigger)
       n8n
        ↓
      Dify
        ↓
   Chatbot trả lời realtime



   Người dùng → Dify Chat UI
                ↓
            Workflow (KHÔNG LLM)
                ↓
             HTTP gọi n8n
                ↓
        n8n xử lý + đọc Sheet
                ↓
           n8n trả TEXT
                ↓
      Dify hiển thị TEXT đó


https://tieunhi171.app.n8n.cloud/webhook-test/anomaly-insight

https://tieunhi171.app.n8n.cloud/webhook-test/anomaly-insight