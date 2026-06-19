# 🌦️ Weather Dashboard

A modern and responsive **Weather Dashboard** built with **HTML, Tailwind CSS, and JavaScript** that provides real-time weather information, 5-day forecasts, hourly temperature charts, location-based weather, dark mode, favourites management, and a complete notification system.

The application fetches live weather data using the **WeatherAPI Forecast API** and provides a smooth user experience with loading skeletons, toast notifications, and proper error handling.

---

## 🚀 Live Demo

🔗 **GitHub Pages:** *(https://irfansfdev.github.io/weather-Dashboard/)*

---

## 📂 GitHub Repository

🔗 *(Add your GitHub repository link here)*

---

# 📌 Features

## 🔍 1. City Search

- Search weather for any city.
- Live weather fetching using API.
- Debounced search to reduce unnecessary API requests.
- Invalid city names display an error toast.

---

## 🌤️ 2. Current Weather

Displays:

- City Name
- Country
- Current Temperature (°C)
- Weather Condition
- Weather Icon
- Humidity
- Wind Speed

---

## 📅 3. 5-Day Weather Forecast

Shows forecast cards containing:

- Date
- Minimum Temperature
- Maximum Temperature
- Weather Condition Icon

---

## 📍 4. Use My Location

- Detects user's current location using the browser's Geolocation API.
- Automatically loads weather for the detected location.
- Displays an error notification if location access is denied.

---

## 📈 5. Hourly Temperature Chart

Built using **Chart.js**

Displays:

- Today's hourly temperature
- Line chart visualization
- Temperature updates every 3 hours

---

## ❤️ 6. Favourite Cities

- Save favourite cities using the heart icon.
- Stores favourites in LocalStorage.
- Quickly reload weather for saved cities.
- Prevents duplicate favourites.

---

## 🌙 7. Dark Mode

- One-click Light/Dark Mode toggle.
- User preference saved in LocalStorage.
- Automatically restored after page refresh.

---

## 🔔 8. Toast Notification System

Supports four notification types:

| Type | Color | Example |
|------|------|---------|
| Success | 🟢 Green | City added to favourites |
| Error | 🔴 Red | City not found |
| Info | 🔵 Blue | Fetching location... |
| Warning | 🟠 Amber | City already exists |

Features:

- Auto dismiss after 3 seconds
- Multiple toast stacking
- Smooth animations

---

## ⌛ 9. Loading Skeletons

While weather data is loading:

- Animated skeleton cards are displayed.
- Replaced automatically once API data is received.

---

## ❌ 10. Error Handling

Proper UI for:

- Network errors
- Invalid API key
- Invalid city names
- API failures

Includes a **Retry** button for failed requests.

---

# 🛠️ Technologies Used

- HTML5
- Tailwind CSS
- JavaScript (ES6+)
- Chart.js
- WeatherAPI
- LocalStorage API
- Geolocation API

---

# 📦 Project Structure

```
Weather-Dashboard/
│
├── index.html
├── style.css
├── script.js
├── assets/
│   ├── icons/
│   └── images/
├── README.md
└── screenshots/
```

# 📱 Responsive Design

The application is fully responsive and works on:

- Desktop
- Laptop
- Tablet
- Mobile Devices

---

# ✨ Future Improvements

- Weather maps
- Air Quality Index (AQI)
- Sunrise & Sunset timings
- Weekly charts
- Multiple language support

---

# 🙌 Acknowledgements

- WeatherAPI
- Chart.js
- Tailwind CSS

---

# 📄 License

This project is developed for educational purposes.

---

# 👨‍💻 Author

**Muhammad Irfan**

GitHub: (https://github.com/irfansfdev/)

LinkedIn: https://www.linkedin.com/in/muhammad-irfan99/
