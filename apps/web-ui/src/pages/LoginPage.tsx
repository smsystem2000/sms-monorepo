import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
} from '@mui/icons-material';
import '../style/Varaible.scss'
import { useLogin } from '../queries/Auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TokenService from '../queries/token/tokenService';
import { useUserStore } from '../stores/userStore';

// Define TypeScript interfaces for props
interface LoginForm {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
}

const LoginPage: React.FC = () => {
  // State management
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const loginMutation = useLogin();
  const isLoading = loginMutation.isPending;
  const { login } = useAuth();
  const navigate = useNavigate();
  const { fetchProfile } = useUserStore();


  // Event handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name as keyof LoginErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }

    if (loginError) setLoginError('');
  };

  // Get redirect path based on role
  const getRedirectPath = (role: string): string => {
    switch (role) {
      case 'super_admin':
        return '/super-admin/dashboard';
      case 'sch_admin':
        return '/school-admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'student':
        return '/student/dashboard';
      case 'parent':
        return '/parent/dashboard';
      default:
        return '/';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: LoginErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    loginMutation.mutate(formData, {
      onSuccess: async (res: any) => {
        console.log("Login response:", res);
        if (res?.data?.token) {
          login(res.data.token);

          // Fetch profile data immediately after login to populate Zustand store
          await fetchProfile();

          // Get role from token and redirect accordingly
          const role = TokenService.getRole();
          const redirectPath = getRedirectPath(role || 'super_admin');
          navigate(redirectPath);
        } else {
          setLoginError("Invalid server response - no token received");
        }
      },
      onError: (err: any) => {
        console.error("Login error:", err);
        setLoginError(
          err?.message ||
          err?.response?.data?.message ||
          "Login failed. Please check credentials."
        );
      },
    });
  };


  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '450px',
        width: '100%',
        borderRadius: 'var(--border-radius-xl, 16px)',
        overflow: 'hidden',
        boxShadow: '0 20px 40px var(--shadow-dark, rgba(0, 0, 0, 0.2))',
      }}>
        <div style={{
          background: 'var(--gradient-primary, linear-gradient(45deg, var(--primary-color), var(--primary-light)))',
          color: 'white',
          padding: 'var(--spacing-xl, 32px)',
          textAlign: 'center',
        }}>
          <Fade in={true} timeout={1000}>
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  fontSize: {
                    xs: 'var(--font-size-xl, 24px)',
                    sm: 'var(--font-size-xxl, 32px)',
                  },
                  marginBottom: 'var(--spacing-sm, 8px)',
                }}
              >
                SMS Platform
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  opacity: 0.9,
                  fontSize: {
                    xs: 'var(--font-size-sm, 14px)',
                    md: 'var(--font-size-md, 16px)'
                  },
                }}
              >
                Sign in to your account
              </Typography>
            </Box>
          </Fade>
        </div>

        {/* Form Section */}
        <div style={{
          padding: 'var(--spacing-xxl, 48px)',
          backgroundColor: 'var(--surface-color, #ffffff)',
        }}>
          <form onSubmit={handleSubmit} style={{
            width: '100%',
          }}>
            {loginError && (
              <Alert
                severity="error"
                sx={{
                  marginBottom: 'var(--spacing-lg, 24px)',
                  borderRadius: 'var(--border-radius-md, 8px)',
                  backgroundColor: 'var(--error-light, #ef5350)',
                  color: 'white',
                  '& .MuiAlert-icon': {
                    color: 'white',
                  },
                }}
              >
                {loginError}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={!!errors.email}
              helperText={errors.email}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'var(--text-secondary, rgba(0, 0, 0, 0.6))' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                marginBottom: 'var(--spacing-lg, 24px)',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 'var(--border-radius-md, 8px)',
                  backgroundColor: 'var(--input-background, rgba(0, 0, 0, 0.04))',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--primary-light, #42a5f5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--primary-color, #1976d2)',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'var(--text-secondary, rgba(0, 0, 0, 0.6))',
                  '&.Mui-focused': {
                    color: 'var(--primary-color, #1976d2)',
                  },
                },
              }}
              placeholder="your.email@example.com"
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              error={!!errors.password}
              helperText={errors.password}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'var(--text-secondary, rgba(0, 0, 0, 0.6))' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label="toggle password visibility"
                      sx={{
                        color: 'var(--text-secondary, rgba(0, 0, 0, 0.6))',
                        '&:hover': {
                          backgroundColor: 'var(--hover-overlay, rgba(0, 0, 0, 0.04))',
                        }
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                marginBottom: 'var(--spacing-lg, 24px)',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 'var(--border-radius-md, 8px)',
                  backgroundColor: 'var(--input-background, rgba(0, 0, 0, 0.04))',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--primary-light, #42a5f5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--primary-color, #1976d2)',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'var(--text-secondary, rgba(0, 0, 0, 0.6))',
                  '&.Mui-focused': {
                    color: 'var(--primary-color, #1976d2)',
                  },
                },
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={isLoading}
              sx={{
                marginTop: 'var(--spacing-xl, 32px)',
                padding: 'var(--spacing-md, 16px)',
                background: 'var(--gradient-primary, linear-gradient(45deg, var(--primary-color), var(--primary-light)))',
                color: 'white',
                fontWeight: 600,
                fontSize: 'var(--font-size-md, 16px)',
                borderRadius: 'var(--border-radius-md, 8px)',
                textTransform: 'none',
                '&:hover': {
                  background: 'var(--primary-dark, #1565c0)',
                  boxShadow: '0 4px 12px var(--shadow-color, rgba(0, 0, 0, 0.1))',
                },
                '&:disabled': {
                  background: 'var(--text-disabled, rgba(0, 0, 0, 0.38))',
                },
              }}
              startIcon={isLoading ?
                <CircularProgress
                  size={20}
                  color="inherit"
                  sx={{ color: 'white' }}
                /> : null
              }
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </Box>
  );
};

export default LoginPage;