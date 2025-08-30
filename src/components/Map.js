import GoogleMapReact from 'google-map-react';

const Map = () => {
  const center = { lat: 42.3265, lng: -122.8756 }; // Example: Oregon
  const zoom = 6;

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: process.env.REACT_APP_GOOGLE_MAPS_API_KEY }}
        defaultCenter={center}
        defaultZoom={zoom}
      />
    </div>
  );
};

export default Map;
