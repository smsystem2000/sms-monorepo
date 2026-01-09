import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    TextField,
    Button,
    Paper,
    CircularProgress,
    Typography,
    Autocomplete,
} from '@mui/material';
import {
    MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issue in react-leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

interface LocationPickerProps {
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
    onLocationChange: (lat: number, lng: number, radius: number) => void;
}

// Component to handle map click events
const MapClickHandler = ({ onClick }: { onClick: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click: (e) => {
            onClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

// Component to recenter map with zoom
const MapRecenter = ({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng], zoom || map.getZoom());
        }
    }, [lat, lng, zoom, map]);
    return null;
};

const LocationPicker = ({
    latitude,
    longitude,
    radiusMeters = 100,
    onLocationChange,
}: LocationPickerProps) => {
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
        latitude && longitude ? { lat: latitude, lng: longitude } : null
    );
    const [radius, setRadius] = useState(radiusMeters);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{
        lat: number;
        lng: number;
        name: string;
        display: string;
    }>>([]);
    const [searching, setSearching] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [zoomLevel, setZoomLevel] = useState<number | undefined>(undefined);

    // Default center (India)
    const defaultCenter = { lat: 20.5937, lng: 78.9629 };
    const mapCenter = position || defaultCenter;

    // Update parent when position or radius changes
    useEffect(() => {
        if (position) {
            onLocationChange(position.lat, position.lng, radius);
        }
    }, [position, radius, onLocationChange]);

    // Handle map click
    const handleMapClick = (lat: number, lng: number) => {
        setPosition({ lat, lng });
    };

    // Get current location
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPosition({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
                setZoomLevel(17); // Zoom in after getting location
                setGettingLocation(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Could not get your location. Please check permissions.');
                setGettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const [searchStatus, setSearchStatus] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Karnataka, India bounding box (approximate)
    const karnatakaBbox = '74.0,11.5,78.5,18.5'; // lon_min,lat_min,lon_max,lat_max

    // Search location using Photon API with India/Karnataka bias
    const performSearch = useCallback(async (query: string) => {
        if (!query.trim() || query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            // Using Photon API with Karnataka location bias
            const response = await fetch(
                `https://photon.komoot.io/api/?q=${encodeURIComponent(query + ' Karnataka India')}&limit=8&lang=en&bbox=${karnatakaBbox}`
            );
            const data = await response.json();
            console.log('Search results:', data);

            if (data?.features && data.features.length > 0) {
                const results = data.features.map((feature: { geometry: { coordinates: number[] }; properties: { name?: string; street?: string; city?: string; state?: string; country?: string } }) => {
                    const [lng, lat] = feature.geometry.coordinates;
                    const props = feature.properties;
                    const name = props.name || props.street || 'Unknown';
                    const parts = [name];
                    if (props.city) parts.push(props.city);
                    if (props.state) parts.push(props.state);
                    if (props.country) parts.push(props.country);
                    return {
                        lat,
                        lng,
                        name,
                        display: parts.join(', '),
                    };
                });
                setSearchResults(results);
                setSearchStatus(null);
            } else {
                setSearchResults([]);
                setSearchStatus('No results found');
            }
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
            setSearchStatus('Search failed');
        }
        setSearching(false);
    }, [karnatakaBbox]);

    // Debounced search wrapper - waits 500ms after user stops typing
    const handleSearch = useCallback((query: string) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        if (!query.trim() || query.length < 2) {
            setSearchResults([]);
            return;
        }
        debounceRef.current = setTimeout(() => {
            performSearch(query);
        }, 500);
    }, [performSearch]);

    // Handle selecting a result
    const handleSelectResult = (result: { lat: number; lng: number; name: string; display: string } | null) => {
        if (result) {
            setPosition({ lat: result.lat, lng: result.lng });
            setZoomLevel(17);
            setSearchStatus(`Selected: ${result.name}`);
            setSearchResults([]);
            setTimeout(() => setSearchStatus(null), 3000);
        }
    };

    return (
        <Box>
            {/* Search Bar */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Autocomplete
                        freeSolo
                        options={searchResults}
                        getOptionLabel={(option) => typeof option === 'string' ? option : option.display}
                        inputValue={searchQuery}
                        onInputChange={(_, value) => {
                            setSearchQuery(value);
                            handleSearch(value);
                        }}
                        onChange={(_, value) => {
                            if (value && typeof value !== 'string') {
                                handleSelectResult(value);
                            }
                        }}
                        loading={searching}
                        sx={{ flex: 1, minWidth: 300 }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                size="small"
                                placeholder="Search location in Karnataka, India..."
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {searching ? <CircularProgress size={16} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                        noOptionsText={searchQuery.length < 2 ? "Type 2+ characters to search" : "No locations found"}
                    />
                    <Button
                        variant="outlined"
                        onClick={handleGetCurrentLocation}
                        disabled={gettingLocation}
                        startIcon={gettingLocation ? <CircularProgress size={16} /> : <MyLocationIcon />}
                    >
                        Use My Location
                    </Button>
                </Box>
                {searchStatus && (
                    <Typography variant="body2" sx={{ mt: 1 }} color={searchStatus.includes('Selected') ? 'success.main' : 'text.secondary'}>
                        {searchStatus}
                    </Typography>
                )}
            </Paper>

            {/* Map */}
            <Paper sx={{ overflow: 'hidden', borderRadius: 2, mb: 2 }}>
                <Box sx={{ height: 400, width: '100%' }}>
                    <MapContainer
                        center={[mapCenter.lat, mapCenter.lng]}
                        zoom={position ? 16 : 5}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickHandler onClick={handleMapClick} />
                        {position && (
                            <>
                                <Circle
                                    center={[position.lat, position.lng]}
                                    radius={radius}
                                    pathOptions={{
                                        color: '#1976d2',
                                        fillColor: '#1976d2',
                                        fillOpacity: 0.15,
                                        weight: 2,
                                    }}
                                />
                                <Marker position={[position.lat, position.lng]} />
                                <MapRecenter lat={position.lat} lng={position.lng} zoom={zoomLevel} />
                            </>
                        )}
                    </MapContainer>
                </Box>
            </Paper>

            {/* Coordinates Display & Radius */}
            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 2, flex: 1, minWidth: 300, flexWrap: 'wrap' }}>
                        <TextField
                            label="Latitude"
                            type="number"
                            size="small"
                            value={position?.lat || ''}
                            onChange={(e) => {
                                const lat = parseFloat(e.target.value);
                                const lng = position?.lng || 0;
                                if (!isNaN(lat)) setPosition({ lat, lng });
                            }}
                            sx={{ flex: 1, minWidth: 120 }}
                        />
                        <TextField
                            label="Longitude"
                            type="number"
                            size="small"
                            value={position?.lng || ''}
                            onChange={(e) => {
                                const lat = position?.lat || 0;
                                const lng = parseFloat(e.target.value);
                                if (!isNaN(lng)) setPosition({ lat, lng });
                            }}
                            sx={{ flex: 1, minWidth: 120 }}
                        />
                    </Box>
                    <TextField
                        type="number"
                        label="Allowed Radius (meters)"
                        value={radius}
                        onChange={(e) => setRadius(Math.max(10, parseInt(e.target.value) || 100))}
                        size="small"
                        sx={{ width: 180 }}
                        inputProps={{ min: 10, max: 1000 }}
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default LocationPicker;
