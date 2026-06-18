let currentCityData = null;
let searchTimeout = null;
let favorites = JSON.parse(localStorage.getItem('weather_favorites')) || [];
let weatherChartInstance = null; 

const elements = {
    searchInput: document.getElementById('search-input'),
    geoBtn: document.getElementById('geo-btn'),
    themeLightBtn: document.getElementById('theme-light-btn'),
    themeDarkBtn: document.getElementById('theme-dark-btn'),
    dashboardView: document.getElementById('weather-dashboard-view'),
    primaryWeatherCard: document.getElementById('primary-weather-card'),
    forecastGrid: document.getElementById('forecast-grid'),
    favoritesList: document.getElementById('favorites-list'),
    currentTime: document.getElementById('current-time'),
    currentDate: document.getElementById('current-date'),
    userGreeting: document.getElementById('user-greeting'),
    chartSection: document.getElementById('chart-section'),
};

function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-5 right-5 z-50 flex flex-col gap-2';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    
    const typeConfig = {
        success: { bg: 'bg-emerald-500', icon: 'fa-circle-check' },
        error: { bg: 'bg-rose-500', icon: 'fa-circle-exclamation' },
        info: { bg: 'bg-blue-500', icon: 'fa-circle-info' },
        warning: { bg: 'bg-amber-500', icon: 'fa-triangle-exclamation'}
    };

    const config = typeConfig[type] || typeConfig.info;
    
    toast.className = `${config.bg} text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-bold flex items-center gap-2 transition-opacity duration-300 opacity-100`;
    toast.innerHTML = `<i class="fa-solid ${config.icon}"></i> ${message}`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function handleFetchError(message) {
    elements.dashboardView.classList.add('hidden');
    elements.dashboardView.classList.remove('flex');
    showToast(message, 'error');
}

function updateTime() {
    const now = new Date();
    elements.currentTime.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    elements.currentDate.textContent = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    const hour = now.getHours();
    elements.userGreeting.innerHTML = `Good ${hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'}!`;
}
setInterval(updateTime, 60000);
updateTime();

function initTheme() {
    const isDark = localStorage.getItem('theme') === 'dark' || 
                   (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
        document.documentElement.classList.add('dark');
        
        elements.themeDarkBtn.classList.add('bg-blue-500', 'text-white');
        elements.themeLightBtn.classList.remove('bg-blue-500', 'text-white');
    } else {
        document.documentElement.classList.remove('dark');
        
        elements.themeLightBtn.classList.add('bg-blue-500', 'text-white');
        elements.themeDarkBtn.classList.remove('bg-blue-500', 'text-white');
    }
}

elements.themeDarkBtn.addEventListener('click', () => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');

    elements.themeDarkBtn.classList.add('bg-blue-500', 'text-white');
    elements.themeLightBtn.classList.remove('bg-blue-500', 'text-white');

    if (weatherChartInstance) updateChartTheme();
});

elements.themeLightBtn.addEventListener('click', () => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');

    elements.themeLightBtn.classList.add('bg-blue-500', 'text-white');
    elements.themeDarkBtn.classList.remove('bg-blue-500', 'text-white');

    if (weatherChartInstance) updateChartTheme(); 
});

elements.geoBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        showToast("Fetching your location...", "info");
        navigator.geolocation.getCurrentPosition((position) => {
            fetchWeather(`${position.coords.latitude},${position.coords.longitude}`);
        }, () => {
            showToast("Unable to retrieve location.", "error");
        });
    }
});

elements.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    if (query.length > 2) {
        searchTimeout = setTimeout(() => fetchWeather(query), 800);
    }
});

function showLoadingSkeletons() {
    const pulseObj = 'animate-pulse bg-slate-200 dark:bg-slate-700';
    
    elements.primaryWeatherCard.innerHTML = `
        <div class="flex justify-between items-start w-full">
            <div class="w-1/2 h-6 rounded-md ${pulseObj}"></div>
            <div class="w-10 h-10 rounded-2xl ${pulseObj}"></div>
        </div>
        <div class="flex flex-col items-center gap-4 my-8 w-full">
            <div class="w-28 h-28 rounded-full ${pulseObj}"></div>
            <div class="w-32 h-20 rounded-lg ${pulseObj}"></div>
            <div class="w-20 h-4 rounded-md ${pulseObj}"></div>
        </div>
        <div class="w-full h-16 rounded-[20px] ${pulseObj}"></div>
    `;

    elements.forecastGrid.innerHTML = Array(5).fill(`
        <div class="bg-white dark:bg-slate-800 rounded-[28px] p-4 flex flex-col items-center justify-between min-h-[205px] border border-slate-100 dark:border-slate-700">
            <div class="w-10 h-3 rounded-sm ${pulseObj} mb-2"></div>
            <div class="w-16 h-16 rounded-full ${pulseObj} my-2"></div>
            <div class="w-12 h-4 rounded-sm ${pulseObj} mt-2"></div>
        </div>
    `).join('');

    if (elements.chartSection) {
        elements.chartSection.innerHTML = `
            <div class="bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-700 w-full mt-4 h-[300px] ${pulseObj}"></div>
        `;
    }
}

async function fetchWeather(query) {
    if (!query) return;
    
    showLoadingSkeletons();
    elements.dashboardView.classList.remove('hidden');
    elements.dashboardView.classList.add('flex');
    if(elements.chartSection) elements.chartSection.style.display = 'block'; 

    try {
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(query)}&days=5&aqi=no&alerts=no`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('City not found. Please try again.');
        const data = await response.json();

        currentCityData = { location: { name: data.location.name } };

        updatePrimaryCard(data);
        updateForecastGrid(data);
        updateHourlyChart(data); 
        checkFavoriteStatus(data.location.name);

    } catch (error) {
        handleFetchError("City not found. Please try again.");
    }
}

function updatePrimaryCard(data) {
    const iconUrl = `https:${data.current.condition.icon}`;

    elements.primaryWeatherCard.innerHTML = `
        <div class="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 bg-black/20 rounded-full blur-3xl pointer-events-none"></div>

        <div class="z-10 relative flex justify-between items-start">
            <div>
                <span class="font-extrabold text-xl flex items-center gap-2 drop-shadow-md">
                    <i class="fa-solid fa-location-dot"></i> ${data.location.name}, ${data.location.country}
                </span>
                <span class="text-[11px] opacity-90 font-semibold block mt-1 uppercase tracking-wide">${new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <button id="toggle-fav-btn" class="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center text-white transition active:scale-95 shadow-sm border border-white/10">
                <i id="fav-heart-icon" class="fa-regular fa-heart text-lg"></i>
            </button>
        </div>
        
        <div class="z-10 relative my-6 flex flex-col items-center text-center">
            <img src="${iconUrl}" alt="icon" class="w-27 h-27 drop-shadow-2xl object-contain -mb-2 scale-125">
            <h2 class="text-7xl font-black tracking-tighter relative inline-block drop-shadow-xl">
                ${Math.round(data.current.temp_c)}<span class="text-3xl font-light absolute top-2 -right-6">°</span>
            </h2>
            <p class="font-bold tracking-widest text-sm opacity-90 capitalize drop-shadow-md mt-2">${data.current.condition.text}</p>
            <p class="text-xs font-medium opacity-75 mt-1">Feels like ${Math.round(data.current.feelslike_c)}°</p>
        </div>

        <div class="z-10 relative grid grid-cols-3 gap-2 bg-black/10 backdrop-blur-md rounded-[20px] p-4 text-xs font-bold border border-white/10 shadow-inner">
            <div class="flex flex-col items-center gap-1.5"><i class="fa-solid fa-wind opacity-60 text-sm"></i><span>${Math.round(data.current.wind_kph)} km/h</span></div>
            <div class="flex flex-col items-center gap-1.5 border-x border-white/10"><i class="fa-solid fa-droplet opacity-60 text-sm"></i><span>${data.current.humidity}%</span></div>
            <div class="flex flex-col items-center gap-1.5"><i class="fa-solid fa-eye opacity-60 text-sm"></i><span>${data.current.vis_km} km</span></div>
        </div>
    `;
    document.getElementById('toggle-fav-btn').addEventListener('click', handleFavToggle);
}

function updateHourlyChart(data) {
    if (!elements.chartSection) return;

    elements.chartSection.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-[32px] shadow-sm w-full mt-4">
            <h3 class="font-bold text-slate-800 dark:text-white mb-4">24-Hour Forecast</h3>
            <div class="relative w-full h-[220px]">
                <canvas id="weatherCanvas"></canvas>
            </div>
        </div>
    `;

    const ctx = document.getElementById('weatherCanvas').getContext('2d');
    
    const currentHour = new Date().getHours();
    const next24Hours = [...data.forecast.forecastday[0].hour, ...data.forecast.forecastday[1].hour].slice(currentHour, currentHour + 24);
    
    const labels = next24Hours.map(h => h.time.split(' ')[1]); 
    const temps = next24Hours.map(h => Math.round(h.temp_c));

    if (weatherChartInstance) {
        weatherChartInstance.destroy();
    }

    const isDark = document.documentElement.classList.contains('dark');

    weatherChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temp',
                data: temps,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#3b82f6',
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    padding: 10,
                    cornerRadius: 12,
                    callbacks: { label: (context) => ` ${context.raw}°C` }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: isDark ? '#64748b' : '#94a3b8', maxTicksLimit: 8 }
                },
                y: {
                    grid: { color: isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(241, 245, 249, 1)' },
                    ticks: { color: isDark ? '#64748b' : '#94a3b8' }
                }
            }
        }
    });
}

function updateChartTheme() {
    if (!weatherChartInstance) return;
    const isDark = document.documentElement.classList.contains('dark');
    weatherChartInstance.options.scales.x.ticks.color = isDark ? '#64748b' : '#94a3b8';
    weatherChartInstance.options.scales.y.ticks.color = isDark ? '#64748b' : '#94a3b8';
    weatherChartInstance.options.scales.y.grid.color = isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(241, 245, 249, 1)';
    weatherChartInstance.update();
}

function updateForecastGrid(data) {
    const days = data.forecast.forecastday;
    
    elements.forecastGrid.innerHTML = days.map((day, index) => {
        const isActive = index === 0;
        const bg = isActive ? 'bg-blue-500 text-white shadow-xl shadow-blue-200 dark:shadow-none border border-blue-400' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700';
        const muted = isActive ? 'text-white/70' : 'text-slate-400 dark:text-slate-500';
        const iconUrl = `https:${day.day.condition.icon}`;
        
        return `
            <div class="${bg} rounded-[15px] p-4 flex flex-col items-center justify-between min-h-[205px]">
                <span class="text-[11px] uppercase tracking-wider font-bold ${isActive ? 'opacity-90' : muted}">${new Date(day.date_epoch * 1000).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</span>
                <img src="${iconUrl}" alt="icon" class="w-17 h-17 my-1 scale-125 drop-shadow-sm">
                <div class="text-sm font-black flex items-center gap-1.5">
                    <span>${Math.round(day.day.maxtemp_c)}°</span>
                    <span class="${muted} font-bold text-xs">${Math.round(day.day.mintemp_c)}°</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderFavorites() {
    if (favorites.length === 0) {
        elements.favoritesList.innerHTML = '<p class="text-[11px] text-slate-400 font-medium text-center py-6 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">No favorites saved yet.</p>';
        return;
    }

    const colors = ['bg-emerald-400 shadow-emerald-100'];

    elements.favoritesList.innerHTML = favorites.map((city, i) => `
        <div onclick="fetchWeather('${city}')" class="${colors[i % colors.length]} text-white rounded-[20px] p-4 flex items-center justify-between shadow-sm cursor-pointer hover:-translate-y-0.5 transition-transform">
            <div class="flex flex-col gap-0.5 text-[10px] font-medium opacity-90">
                <span class="font-black text-sm opacity-100 tracking-wide">${city}</span>
                <span>Click to view</span>
            </div>
            <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm"><i class="fa-solid fa-chevron-right text-xs"></i></div>
        </div>
    `).join('');
}

function handleFavToggle() {
    if (!currentCityData) return;
    const cityName = currentCityData.location.name;
    const index = favorites.indexOf(cityName);

    if (index > -1) {
        favorites.splice(index, 1);
        showToast(`${cityName} removed from favourites`, 'warning');
    } else {
        if (favorites.includes(cityName)) {
            showToast(`${cityName} is already in your favourites`, 'info');
            return;
        }
        favorites.push(cityName);
        showToast(`${cityName} added to favourites`, 'success');
    }

    localStorage.setItem('weather_favorites', JSON.stringify(favorites));
    checkFavoriteStatus(cityName);
    renderFavorites();
}

function checkFavoriteStatus(cityName) {
    const icon = document.getElementById('fav-heart-icon');
    if (!icon) return;
    icon.className = favorites.includes(cityName) ? 'fa-solid fa-heart text-rose-400' : 'fa-regular fa-heart';
}

initTheme();
renderFavorites();
fetchWeather('karachi');