const WEATHER_WIDGET_URL = './weather-widget.html';

async function loadWeatherWidget() {
  const slot = document.querySelector('#weather-widget-slot0, #weather-widget-slot');
  if (!slot) return null;

  try {
    const response = await fetch(WEATHER_WIDGET_URL);
    if (!response.ok) throw new Error(`No se pudo cargar el widget: ${response.status}`);
    slot.innerHTML = await response.text();
    return document.getElementById('weather-widget');
  } catch (error) {
    console.error('Error al cargar el widget del clima:', error);
    return null;
  }
}

async function initWeather() {
  if (!navigator.geolocation) return;

  const widget = await loadWeatherWidget();
  if (!widget) return;

  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    const { latitude, longitude } = coords;

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
      );
      if (!response.ok) throw new Error(`Open-Meteo respondió ${response.status}`);

      const data = await response.json();
      const temperature = Math.round(data.current.temperature_2m);
      const weatherCode = data.current.weather_code;

      document.getElementById('weather-icon').className = `fas ${weatherIcon(weatherCode)}`;
      document.getElementById('weather-text').textContent = `${temperature}°C`;
      widget.style.display = document.body.classList.contains('multiradios') && window.innerWidth > 768
        ? 'none'
        : 'flex';

      updateWeatherCity(latitude, longitude);
    } catch (error) {
      console.error('Error al obtener el clima:', error);
    }
  }, () => {}, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
}

async function updateWeatherCity(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
    );
    if (!response.ok) return;

    const geo = await response.json();
    const address = geo.address || {};
    const city = address.city || address.town || address.village || address.municipality || '';
    if (!city) return;

    document.getElementById('weather-city').textContent = city;
    document.title = `Clima en ${city}`;
  } catch (error) {
    console.error('Error al detectar la ciudad:', error);
  }
}

function weatherIcon(code) {
  if (code === 0) return 'fa-sun';
  if (code <= 2) return 'fa-cloud-sun';
  if (code <= 3) return 'fa-cloud';
  if (code <= 49) return 'fa-smog';
  if (code <= 59) return 'fa-cloud-drizzle';
  if (code <= 69) return 'fa-cloud-rain';
  if (code <= 79) return 'fa-snowflake';
  if (code <= 82) return 'fa-cloud-showers-heavy';
  if (code <= 86) return 'fa-snowflake';
  if (code <= 99) return 'fa-bolt';
  return 'fa-cloud';
}

document.addEventListener('DOMContentLoaded', initWeather);
