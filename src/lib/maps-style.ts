export const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0b1220' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1220' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5f6d8a' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#243147' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0f1a2c' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#17273d' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#1f3554' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#06101f' }] }
];
