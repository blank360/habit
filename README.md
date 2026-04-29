# ◈ Habit Forge — Monthly Habit Tracker

A beautiful, dark-themed monthly habit tracker with Firebase authentication and real-time sync.

## Features
- 🔐 **Auth** — Email/password sign up & sign in (data syncs across devices)
- 📋 **10 Editable Habits** — Click any habit name to rename it
- ☑️ **Daily Check Grid** — 31-column grid, check off each day's habits
- 📈 **Score Area Chart** — Recharts area graph of daily completion scores
- 📊 **Score Bar Heatmap** — Visual bar heatmap across all days of month
- ☁️ **Real-time Firestore Sync** — Changes saved instantly, visible on any device
- 🌑 **Dark aesthetic** — Syne + DM Mono fonts, grain texture, ambient glow

## Setup

### 1. Create a Firebase Project
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → give it a name → Continue
3. On the project page, click the **Web** icon (`</>`) to add a web app
4. Register the app, then copy the `firebaseConfig` object

### 2. Enable Firebase Services
- **Authentication**: Firebase Console → Build → Authentication → Get Started → Enable **Email/Password**
- **Firestore**: Firebase Console → Build → Firestore Database → Create database → Start in **test mode**

### 3. Add Your Firebase Config
Open `src/firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Install & Run
```bash
npm install
npm start
```

### 5. Deploy (optional)
```bash
npm run build
# Then deploy the `build/` folder to Vercel, Netlify, Firebase Hosting, etc.
```

## Firestore Data Structure
```
users/{uid}/months/{YYYY-MM}
  habits: string[]        // Array of 10 habit names
  checks: { "habitIdx_day": true }  // Sparse map of checked cells
```

## Tech Stack
- React 18
- Firebase v10 (Auth + Firestore)
- Recharts (graph)
- Framer Motion (ready to extend)
- DM Mono + Syne + Fraunces (Google Fonts)
