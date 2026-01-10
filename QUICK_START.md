# Quick Start Guide - AI Trading Report with PDF Download

## 🚀 Getting Started in 3 Minutes

### Step 1: Configure API Key (30 seconds)
The `.env` file has been created in the `BackEND/` directory with your Gemini API key already configured. You're ready to go!

### Step 2: Start the Backend (30 seconds)
```bash
cd BackEND
npm run dev
```

Expected output:
```
🎮 ═══════════════════════════════════════
   BullRun Server Started
   Local: http://localhost:3001
   Network: http://[your-ip]:3001
═══════════════════════════════════════
```

### Step 3: Start the Frontend (30 seconds)
Open a new terminal:
```bash
cd FrontEND
npm run dev
```

Expected output:
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

### Step 4: Play & Generate Report (90 seconds)
1. Open browser to `http://localhost:5173`
2. Click "Solo Mode"
3. Enter your name and age
4. Play the game (or skip to year 20 for testing)
5. On Game End Screen, click "📊 Generate My Trading Report"
6. Wait 5-10 seconds for AI analysis
7. Click "📄 Download PDF" to save your report

**Done!** 🎉

---

## 📊 What You Get

### AI Analysis Report Includes:
- **Trading Style Classification** (15+ behavioral patterns)
- **Best Trade Analysis** with reasoning
- **Worst Trade Analysis** with reasoning
- **Personalized Recommendations** (3-5 actionable insights)
- **Behavioral Insights** (age-appropriate)

### PDF Export Features:
- Professional branded layout
- Color-coded performance metrics
- Player information card
- Full AI report with formatting
- Automatic filename generation

---

## 🔍 Testing the Feature

### Quick Test (Without Playing):
Since trade integration is pending, the report will show "No trades recorded" which is normal. The AI will still generate a basic performance report based on your final networth and CAGR.

### Full Test (With Gameplay):
Play through the 20-year game making various trades to get comprehensive AI insights.

---

## 📁 Generated Files

### Where to Find Your PDFs:
- Default Downloads folder
- Filename format: `TradingReport_[YourName]_[Date].pdf`
- Example: `TradingReport_John_Doe_2026-01-09.pdf`

---

## 🛠️ Troubleshooting

### Issue: Backend won't start
```bash
cd BackEND
npm install
npm run dev
```

### Issue: Frontend won't start
```bash
cd FrontEND
npm install
npm run dev
```

### Issue: "Gemini API key not configured"
Check that `BackEND/.env` exists and contains:
```
GEMINI_API_KEY=AIzaSyCEunwfBzSn2geRaKN-5tG1A5x9x7qhF3U
```

### Issue: PDF doesn't download
- Allow pop-ups in your browser
- Check browser download settings
- Try a different browser (Chrome/Edge recommended)

---

## 📚 More Information

- **Complete Setup Guide**: [AI_REPORT_SETUP.md](AI_REPORT_SETUP.md)
- **PDF Feature Details**: [PDF_DOWNLOAD_GUIDE.md](PDF_DOWNLOAD_GUIDE.md)
- **Implementation Details**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

## ⚡ Advanced Usage

### Change Port Numbers:
**Backend** (in `.env`):
```
PORT=3001
```

**Frontend** (in `vite.config.ts`):
```typescript
server: { port: 5173 }
```

### Monitor API Usage:
Check your usage at [Google AI Studio](https://makersuite.google.com/)

Free tier: 1,500 requests/day

---

## 🎯 Feature Checklist

- ✅ Name & Age collection on onboarding
- ✅ Enhanced database with trade tracking
- ✅ AI report generation with Gemini 3 Flash
- ✅ Context caching for large datasets
- ✅ Professional PDF export
- ✅ One-page report format
- ✅ Behavioral pattern detection
- ✅ Actionable recommendations
- ✅ Age-appropriate insights

---

## 💡 Tips for Best Results

1. **Complete Full Games**: Play through all 20 years
2. **Make Diverse Trades**: More activity = better AI insights
3. **Use Real Strategy**: AI detects patterns
4. **Save Multiple Reports**: Track your improvement
5. **Share Your Success**: PDFs are easy to print/email

---

**Ready to Generate Your First AI Trading Report?** 🚀

Run the commands above and start playing!
