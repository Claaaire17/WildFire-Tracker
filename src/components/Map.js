import GoogleMapReact from 'google-map-react';
import LocationMarker from './LocationMarker';

const Map = ({ eventData }) => {
  const center = { lat: 42.3265, lng: -122.8756 }; // Oregon
  const zoom = 6;

  const markers = (eventData || [])
    // v3 events: categories[0].id is "wildfires" not 8
    .filter(ev => ev?.categories?.[0]?.id === 'wildfires' && ev?.geometry?.length)
    .map(ev => {
      // coordinates = [lng, lat]
      const [lng, lat] = ev.geometry[0].coordinates;
      return <LocationMarker key={ev.id} lat={lat} lng={lng} />;
    });

  return (
    <div className="map-container">
      <GoogleMapReact
        bootstrapURLKeys={{ key: process.env.REACT_APP_GOOGLE_MAPS_API_KEY }}
        defaultCenter={center}
        defaultZoom={zoom}
      >
        {markers}
      </GoogleMapReact>
    </div>
  );
};

export default Map;
