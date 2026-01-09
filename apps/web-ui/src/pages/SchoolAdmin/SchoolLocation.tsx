import { useState, useCallback, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Alert,
    Snackbar,
    CircularProgress,
    Paper,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import LocationPicker from '../../components/LocationPicker';
import { useGetSchoolById, useUpdateSchool } from '../../queries/School';
import TokenService from '../../queries/token/tokenService';

const SchoolLocation = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { data: schoolData, isLoading, error } = useGetSchoolById(schoolId);
    const updateSchool = useUpdateSchool();

    const school = schoolData?.data;
    const currentLocation = school?.location;

    const [location, setLocation] = useState<{
        latitude: number;
        longitude: number;
        radiusMeters: number;
    } | null>(null);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error',
    });

    // Initialize location from school data
    useEffect(() => {
        if (currentLocation?.latitude && currentLocation?.longitude) {
            setLocation({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                radiusMeters: currentLocation.radiusMeters || 100,
            });
        }
    }, [currentLocation]);

    const handleLocationChange = useCallback((lat: number, lng: number, radius: number) => {
        setLocation({ latitude: lat, longitude: lng, radiusMeters: radius });
    }, []);

    const handleSave = async () => {
        if (!location) {
            setSnackbar({
                open: true,
                message: 'Please select a location on the map',
                severity: 'error',
            });
            return;
        }

        try {
            const result = await updateSchool.mutateAsync({
                schoolId,
                data: { location },
            });
            console.log('Location save result:', result);
            setSnackbar({
                open: true,
                message: 'School location saved successfully!',
                severity: 'success',
            });
        } catch (error) {
            console.error('Location save error:', error);
            setSnackbar({
                open: true,
                message: 'Failed to save location',
                severity: 'error',
            });
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load school data</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                School Location Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Set the school's location for teacher attendance verification. Teachers must be within the specified radius to check in.
            </Typography>

            {/* Current Location Info */}
            {currentLocation?.latitude && currentLocation?.longitude && (
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.50' }}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                        Current Location Set
                    </Typography>
                    <Typography variant="body2">
                        {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                        (Radius: {currentLocation.radiusMeters || 100}m)
                    </Typography>
                </Paper>
            )}

            {/* Location Picker */}
            <LocationPicker
                latitude={currentLocation?.latitude}
                longitude={currentLocation?.longitude}
                radiusMeters={currentLocation?.radiusMeters}
                onLocationChange={handleLocationChange}
            />

            {/* Save Button */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={
                        updateSchool.isPending ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            <SaveIcon />
                        )
                    }
                    onClick={handleSave}
                    disabled={updateSchool.isPending || !location}
                >
                    Save Location
                </Button>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SchoolLocation;
