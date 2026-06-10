import { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Navigation } from 'lucide-react';

const DEFAULT_LAT = 16.047079; // Da Nang center as default
const DEFAULT_LNG = 108.206230;

const loadLeaflet = () => {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L);
      return;
    }

    // Inject CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Inject JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      if (window.L) {
        resolve(window.L);
      } else {
        reject(new Error('Leaflet loaded but window.L is undefined'));
      }
    };
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};

const parseNominatimAddress = (addr) => {
  if (!addr) return { city: '', district: '', ward: '' };
  const city = addr.city || addr.town || addr.village || addr.state || '';
  const district = addr.city_district || addr.district || addr.county || '';
  const ward = addr.suburb || addr.quarter || addr.neighborhood || '';
  return { city, district, ward };
};

const GoogleMapsPicker = ({ 
  initialLat, 
  initialLng, 
  initialAddress = '', 
  onLocationSelect 
}) => {
  const mapRef = useRef(null);
  const [L, setL] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [markerInstance, setMarkerInstance] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [coordinates, setCoordinates] = useState({ 
    lat: Number(initialLat) || DEFAULT_LAT, 
    lng: Number(initialLng) || DEFAULT_LNG 
  });

  // Load Leaflet resources
  useEffect(() => {
    loadLeaflet()
      .then((leaflet) => {
        setL(leaflet);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load Leaflet', err);
        setError('Không thể tải thư viện bản đồ. Vui lòng kiểm tra kết nối mạng.');
        setLoading(false);
      });
  }, []);

  // Initialize Map
  useEffect(() => {
    if (loading || error || !mapRef.current || !L) return;

    const lat = Number(initialLat) || coordinates.lat;
    const lng = Number(initialLng) || coordinates.lng;

    // Create map instance
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true
    }).setView([lat, lng], 15);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create custom green/blue marker icon to make it premium
    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Add marker
    const marker = L.marker([lat, lng], { 
      draggable: true,
      icon: customIcon
    }).addTo(map);

    setMapInstance(map);
    setMarkerInstance(marker);

    // Reverse geocode if initial address is empty but coordinates exist
    if (!initialAddress && (Number(initialLat) && Number(initialLng))) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            setSearchQuery(data.display_name);
            const { city, district, ward } = parseNominatimAddress(data.address);
            if (onLocationSelect) {
              onLocationSelect({
                latitude: lat,
                longitude: lng,
                formattedAddress: data.display_name,
                googlePlaceId: String(data.place_id),
                city,
                district,
                ward
              });
            }
          }
        })
        .catch(err => console.error(err));
    }

    return () => {
      map.remove();
    };
  }, [loading, L]);

  // Set up marker drag listeners
  useEffect(() => {
    if (!mapInstance || !markerInstance || !L) return;

    markerInstance.on('dragend', () => {
      const position = markerInstance.getLatLng();
      const lat = position.lat;
      const lng = position.lng;

      setCoordinates({ lat, lng });

      // Reverse geocoding via Nominatim
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            const formattedAddress = data.display_name;
            const placeId = data.place_id;

            setSearchQuery(formattedAddress);
            const { city, district, ward } = parseNominatimAddress(data.address);

            if (onLocationSelect) {
              onLocationSelect({
                latitude: lat,
                longitude: lng,
                formattedAddress,
                googlePlaceId: String(placeId),
                city,
                district,
                ward
              });
            }
          }
        })
        .catch(err => console.error(err));
    });

    return () => {
      markerInstance.off('dragend');
    };
  }, [mapInstance, markerInstance, L]);

  // Autocomplete Suggestions search via Nominatim
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3 || searchQuery === initialAddress) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&limit=5&accept-language=vi`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSuggestions(data.map(item => ({
              display_name: item.display_name,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              place_id: item.place_id
            })));
          }
        })
        .catch(err => console.error(err));
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSelectSuggestion = (item) => {
    setSearchQuery(item.display_name);
    setSuggestions([]);
    setCoordinates({ lat: item.lat, lng: item.lon });

    if (mapInstance && markerInstance) {
      mapInstance.setView([item.lat, item.lon], 16);
      markerInstance.setLatLng([item.lat, item.lon]);
    }

    // Fetch full address details from Nominatim
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${item.lat}&lon=${item.lon}&accept-language=vi`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          const formattedAddress = data.display_name || item.display_name;
          const placeId = data.place_id || item.place_id;
          const { city, district, ward } = parseNominatimAddress(data.address);

          if (onLocationSelect) {
            onLocationSelect({
              latitude: item.lat,
              longitude: item.lon,
              formattedAddress,
              googlePlaceId: String(placeId),
              city,
              district,
              ward
            });
          }
        }
      })
      .catch(err => {
        console.error(err);
        if (onLocationSelect) {
          onLocationSelect({
            latitude: item.lat,
            longitude: item.lon,
            formattedAddress: item.display_name,
            googlePlaceId: String(item.place_id),
            city: '',
            district: '',
            ward: ''
          });
        }
      });
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation && mapInstance && markerInstance) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setCoordinates({ lat, lng });
          mapInstance.setView([lat, lng], 16);
          markerInstance.setLatLng([lat, lng]);

          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`)
            .then(res => res.json())
            .then(data => {
              if (data && data.display_name) {
                const formattedAddress = data.display_name;
                const placeId = data.place_id;
                const { city, district, ward } = parseNominatimAddress(data.address);
                
                setSearchQuery(formattedAddress);
                
                if (onLocationSelect) {
                  onLocationSelect({
                    latitude: lat,
                    longitude: lng,
                    formattedAddress,
                    googlePlaceId: String(placeId),
                    city,
                    district,
                    ward
                  });
                }
              }
            })
            .catch(err => console.error(err));
        },
        () => {
          alert('Không thể định vị vị trí của bạn. Vui lòng cho phép quyền truy cập GPS.');
        }
      );
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', background: 'var(--surface-soft)', borderRadius: '12px', gap: '10px' }}>
        <span className="pd-loading-spinner" style={{ width: '32px', height: '32px' }}></span>
        <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Đang tải bản đồ miễn phí...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#991b1b', fontSize: '0.9rem', textAlign: 'center' }}>
        {error}
      </div>
    );
  }

  return (
    <div className="openstreetmap-picker-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', gap: '8px', width: '100%' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Tìm kiếm địa điểm, phường xã, quận huyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
          />
          
          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <ul style={{ 
              position: 'absolute', 
              top: '100%', 
              left: 0, 
              right: 0, 
              background: 'var(--surface)', 
              border: '1px solid var(--border)', 
              borderRadius: '8px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
              zIndex: 9999, 
              margin: '4px 0 0 0', 
              padding: 0, 
              listStyle: 'none',
              maxHeight: '220px',
              overflowY: 'auto'
            }}>
              {suggestions.map((item) => (
                <li 
                  key={item.place_id} 
                  onClick={() => handleSelectSuggestion(item)}
                  style={{ 
                    padding: '10px 12px', 
                    cursor: 'pointer', 
                    fontSize: '0.85rem', 
                    borderBottom: '1px solid var(--border)',
                    textAlign: 'left',
                    color: 'var(--text)'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--surface-soft)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <MapPin size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--accent)' }} />
                  {item.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', borderRadius: '10px', background: 'var(--surface-soft)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}
          title="Sử dụng vị trí hiện tại"
        >
          <Navigation size={18} style={{ color: 'var(--text)' }} />
        </button>
      </div>

      <div 
        ref={mapRef} 
        style={{ width: '100%', height: '300px', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', zIndex: 1 }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--muted)', background: 'var(--surface-soft)', padding: '8px 12px', borderRadius: '8px' }}>
        <MapPin size={14} style={{ color: 'var(--accent)' }} />
        <span>
          Tọa độ: <strong>{coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</strong> (Kéo marker trên bản đồ để định vị chính xác)
        </span>
      </div>
    </div>
  );
};

export default GoogleMapsPicker;
