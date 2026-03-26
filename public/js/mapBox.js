/* eslint-disable */
export const displayMap = (locations) => {
  // Verificăm dacă biblioteca s-a încărcat din <script>-ul din Pug
  if (!window.mapboxgl) return;

  // Folosim window. peste tot pentru a evita ReferenceError
  window.mapboxgl.accessToken =
    'pk.eyJ1IjoiZGFyaXB0ciIsImEiOiJjbWxxajlpbHQwMTliM2RzbGVsYzh3eHJwIn0.QLTS6TibTMNarwECd4k60g';

  const map = new window.mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    scrollZoom: false,
  });

  const bounds = new window.mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Adăugare marker
    const el = document.createElement('div');
    el.className = 'marker';

    new window.mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Adăugare popup
    new window.mapboxgl.Popup({
      offset: 50,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: { top: 200, bottom: 150, left: 100, right: 100 },
  });
};
