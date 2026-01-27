import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  IconButton,
  TextField,
  Typography,
  Box,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";

interface IconPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  currentIcon?: string;
}

const IconPickerDialog: React.FC<IconPickerDialogProps> = ({
  open,
  onClose,
  onSelect,
  currentIcon,
}) => {
  const [searchTerm, setSearchTerm] = useState(""); // Default search is now blank
  const [icons, setIcons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch icons from Iconify API
  const searchIcons = async (query: string) => {
    setIsLoading(true);
    try {
      // Using Iconify Public API
      const response = await fetch(
        `https://api.iconify.design/search?query=${encodeURIComponent(
          query,
        )}&limit=60`,
      );
      const data = await response.json();
      if (data.icons) {
        setIcons(data.icons);
      } else {
        setIcons([]);
      }
    } catch (error) {
      console.error("Failed to fetch icons:", error);
      setIcons([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchIcons(searchTerm);
      } else {
        setIcons([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle initial load when dialog opens
  useEffect(() => {
    if (open && icons.length === 0 && searchTerm) {
      searchIcons(searchTerm);
    }
  }, [open]);

  const handleIconClick = (iconName: string) => {
    onSelect(iconName);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: "80vh", display: "flex", flexDirection: "column" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        Select Icon
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search icons (e.g. school, user, chart)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          size="small"
          autoFocus
        />
      </Box>

      <DialogContent dividers sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              width: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {icons.map((iconName) => {
              const isSelected = currentIcon === iconName;

              return (
                <Grid
                  size={{ xs: 4, sm: 3, md: 2 }}
                  key={iconName}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  <Button
                    onClick={() => handleIconClick(iconName)}
                    variant={isSelected ? "contained" : "outlined"}
                    color={isSelected ? "primary" : "inherit"}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 1.5,
                      width: "100%",
                      borderColor: isSelected ? "primary.main" : "divider",
                      "&:hover": {
                        backgroundColor: isSelected
                          ? "primary.dark"
                          : "action.hover",
                        borderColor: isSelected
                          ? "primary.dark"
                          : "text.primary",
                      },
                      textTransform: "none",
                      gap: 1,
                    }}
                  >
                    <img
                      src={`https://api.iconify.design/${iconName}.svg`}
                      alt={iconName}
                      style={{
                        width: 32,
                        height: 32,
                        filter: isSelected
                          ? "brightness(0) invert(1)"
                          : "grayscale(100%) brightness(0.2)",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        width: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        textAlign: "center",
                        fontSize: "0.7rem",
                      }}
                    >
                      {iconName}
                    </Typography>
                  </Button>
                </Grid>
              );
            })}

            {!isLoading && icons.length === 0 && (
              <Box sx={{ width: "100%", textAlign: "center", py: 4 }}>
                <Typography color="text.secondary">
                  No icons found matching "{searchTerm}"
                </Typography>
              </Box>
            )}
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default IconPickerDialog;
