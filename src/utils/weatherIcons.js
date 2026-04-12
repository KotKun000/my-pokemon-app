const base = import.meta.env.BASE_URL || '/';

/** ไอคอน SVG ใน public/WeatherIcon/{id}.svg — id ตรงกับ battleWeather_th.json */
export function getBattleWeatherIconUrl(weatherId) {
  const id = String(weatherId || '').toLowerCase();
  return `${base}WeatherIcon/${id}.svg`;
}
