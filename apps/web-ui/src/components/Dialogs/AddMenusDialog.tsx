import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Checkbox,
  ListItemText,
  Chip,
  Box,
  OutlinedInput,
  InputAdornment,
} from "@mui/material";
import { Close as CloseIcon, Apps as AppsIcon } from "@mui/icons-material";
import { useCreateMenu, useGetMenus, useUpdateMenu } from "../../queries/Menus";
import { useGetSchools } from "../../queries/School";
import type { CreateMenuPayload, Menu } from "../../types";
import IconPickerDialog from "./IconPickerDialog";

interface AddMenusDialogProps {
  open: boolean;
  onClose: () => void;
  menuToEdit?: Menu;
}

const AddMenusDialog: React.FC<AddMenusDialogProps> = ({
  open,
  onClose,
  menuToEdit,
}) => {
  const [formData, setFormData] = useState<CreateMenuPayload>({
    schoolId: "",
    menuName: "",
    menuUrl: "",
    menuIcon: "",
    menuAccessRoles: [],
    hasSubmenu: false,
    parentMenuId: "",
    menuType: "main",
    status: "active",
    menuOrder: 0,
  });

  const [menuType, setMenuType] = useState<"main" | "sub">("main");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const createMutation = useCreateMenu();
  const updateMutation = useUpdateMenu();
  const { data: schoolsData, isLoading: isLoadingSchools } = useGetSchools();
  const { data: menusData } = useGetMenus();

  const schools = schoolsData?.data || [];

  // Filter for potential parent menus (Main Menus that are not submenus themselves)
  const parentMenuOptions =
    menusData?.data?.filter((menu: any) => !menu.parentMenuId) || [];

  // Populate form data when menuToEdit changes or dialog opens
  useEffect(() => {
    if (open && menuToEdit) {
      setFormData({
        schoolId: menuToEdit.schoolId || "",
        menuName: menuToEdit.menuName || "",
        menuUrl: menuToEdit.menuUrl || "",
        menuIcon: menuToEdit.menuIcon || "",
        menuAccessRoles: Array.isArray(menuToEdit.menuAccessRoles)
          ? menuToEdit.menuAccessRoles
          : [menuToEdit.menuAccessRoles],
        hasSubmenu: menuToEdit.hasSubmenu || false,
        parentMenuId: menuToEdit.parentMenuId || "",
        menuType: menuToEdit.menuType || "main",
        status: menuToEdit.status || "active",
        menuOrder: menuToEdit.menuOrder ?? 0,
      });
      setMenuType(menuToEdit.menuType || "main");
    }
  }, [open, menuToEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name as string]: value }));
    if (errors[name as string]) {
      setErrors((prev) => ({ ...prev, [name as string]: "" }));
    }
  };

  const handleMenuTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const type = e.target.value as "main" | "sub";
    setMenuType(type);
    setFormData((prev) => ({ ...prev, menuType: type }));
    if (type === "main") {
      setFormData((prev) => ({ ...prev, parentMenuId: "", menuType: type }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.menuName.trim()) newErrors.menuName = "Menu name is required";
    if (!formData.menuUrl.trim()) newErrors.menuUrl = "Menu path is required";
    if (formData.menuOrder === undefined || formData.menuOrder === null)
      newErrors.menuOrder = "Order is required";
    if (
      !formData.menuAccessRoles ||
      (Array.isArray(formData.menuAccessRoles) &&
        formData.menuAccessRoles.length === 0)
    )
      newErrors.menuAccessRoles = "Role is required";
    // For admin roles (like super_admin), schoolId is not required
    const isSuperAdmin = Array.isArray(formData.menuAccessRoles)
      ? formData.menuAccessRoles.includes("super_admin")
      : formData.menuAccessRoles === "super_admin";

    if (!isSuperAdmin && !formData.schoolId)
      newErrors.schoolId = "School is required";

    if (menuType === "sub" && !formData.parentMenuId?.trim()) {
      newErrors.parentMenuId = "Main Menu Heading is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (menuToEdit) {
        await updateMutation.mutateAsync({
          menuId: menuToEdit.menuId,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      handleClose();
    } catch {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    setFormData({
      schoolId: "",
      menuName: "",
      menuUrl: "",
      menuIcon: "",
      menuAccessRoles: [],
      hasSubmenu: false,
      parentMenuId: "",
      menuType: "main",
      status: "active",
      menuOrder: 0,
    });
    setMenuType("main");
    setErrors({});
    createMutation.reset();
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isError = createMutation.isError || updateMutation.isError;
  const errorMessage =
    (createMutation.error as { message?: string })?.message ||
    (updateMutation.error as { message?: string })?.message ||
    "Operation failed";

  // Role options
  const roles = [
    { value: "super_admin", label: "Super Admin" },
    { value: "sch_admin", label: "School Admin" },
    { value: "teacher", label: "Teacher" },
    { value: "student", label: "Student" },
    { value: "parent", label: "Parent" },
  ];

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        sx={{ mt: 5 }}
        fullWidth
        scroll="paper"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {menuToEdit ? "Edit Menu" : "Add New Menu"}
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ height: "500px" }}>
            {isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}

            <Grid container spacing={2}>
              {/* School Selection */}
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth error={!!errors.schoolId}>
                  <InputLabel>School</InputLabel>
                  <Select
                    name="schoolId"
                    value={formData.schoolId}
                    onChange={(e) => handleChange(e as any)}
                    label="School"
                    disabled={isLoadingSchools}
                  >
                    {schools.map((school) => (
                      <MenuItem key={school.schoolId} value={school.schoolId}>
                        {school.schoolName}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.schoolId && (
                    <FormHelperText>{errors.schoolId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Menu Name */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  name="menuName"
                  label="Menu Name"
                  value={formData.menuName}
                  onChange={handleChange}
                  error={!!errors.menuName}
                  helperText={errors.menuName}
                  required
                  fullWidth
                />
              </Grid>

              {/* Status Selection */}
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={(e) => handleChange(e as any)}
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Menu Type Selection */}
              <Grid size={{ xs: 12 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Menu Type</FormLabel>
                  <RadioGroup
                    row
                    name="menuType"
                    value={menuType}
                    onChange={handleMenuTypeChange}
                  >
                    <FormControlLabel
                      value="main"
                      control={<Radio />}
                      label="Main Menu"
                    />
                    <FormControlLabel
                      value="sub"
                      control={<Radio />}
                      label="Sub Menu"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {/* Main Menu Heading (Parent ID) - Conditional */}
              {menuType === "sub" && (
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth error={!!errors.parentMenuId}>
                    <InputLabel>Main Menu Heading</InputLabel>
                    <Select
                      name="parentMenuId"
                      value={formData.parentMenuId}
                      onChange={(e) => handleChange(e as any)}
                      label="Main Menu Heading"
                    >
                      {parentMenuOptions.map((menu: any) => (
                        <MenuItem key={menu.menuId} value={menu.menuId}>
                          {menu.menuName}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.parentMenuId && (
                      <FormHelperText>{errors.parentMenuId}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              )}

              {/* Menu Path */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  name="menuUrl"
                  label="Menu Path"
                  value={formData.menuUrl}
                  onChange={handleChange}
                  error={!!errors.menuUrl}
                  helperText={errors.menuUrl}
                  required
                  fullWidth
                />
              </Grid>

              {/* Menu Order */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  name="menuOrder"
                  label="Menu Order"
                  type="number"
                  value={formData.menuOrder}
                  onChange={handleChange}
                  error={!!errors.menuOrder}
                  helperText={errors.menuOrder}
                  required
                  fullWidth
                />
              </Grid>

              {/* Menu Icon */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  name="menuIcon"
                  label="Menu Icon"
                  value={formData.menuIcon}
                  onClick={() => setIconPickerOpen(true)}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setIconPickerOpen(true)}
                          edge="end"
                        >
                          <AppsIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                  placeholder="Click to select an icon"
                />
              </Grid>

              {/* Role Selection */}
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth error={!!errors.menuAccessRoles}>
                  <InputLabel>Roles</InputLabel>
                  <Select
                    name="menuAccessRoles"
                    multiple
                    value={
                      Array.isArray(formData.menuAccessRoles)
                        ? formData.menuAccessRoles
                        : [formData.menuAccessRoles] // Fallback if string
                    }
                    onChange={(e) => handleChange(e as any)}
                    input={<OutlinedInput label="Roles" />}
                    renderValue={(selected) => {
                      const selectedRoles = (
                        Array.isArray(selected) ? selected : [selected]
                      ) as string[];
                      return (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {selectedRoles.map((value) => {
                            const roleLabel = roles.find(
                              (r) => r.value === value,
                            )?.label;
                            return (
                              <Chip
                                key={value}
                                label={roleLabel || value}
                                onDelete={() => {
                                  const currentRoles = Array.isArray(
                                    formData.menuAccessRoles,
                                  )
                                    ? formData.menuAccessRoles
                                    : [formData.menuAccessRoles];
                                  const newRoles = currentRoles.filter(
                                    (r) => r !== value,
                                  );
                                  setFormData((prev) => ({
                                    ...prev,
                                    menuAccessRoles: newRoles,
                                  }));
                                }}
                                onMouseDown={(event) => {
                                  event.stopPropagation();
                                }}
                              />
                            );
                          })}
                        </Box>
                      );
                    }}
                  >
                    {roles.map((role) => {
                      const selectedArray = Array.isArray(
                        formData.menuAccessRoles,
                      )
                        ? formData.menuAccessRoles
                        : [formData.menuAccessRoles];
                      return (
                        <MenuItem key={role.value} value={role.value}>
                          <Checkbox
                            checked={selectedArray.indexOf(role.value) > -1}
                          />
                          <ListItemText primary={role.label} />
                        </MenuItem>
                      );
                    })}
                  </Select>
                  {errors.menuAccessRoles && (
                    <FormHelperText>{errors.menuAccessRoles}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isPending}
              startIcon={isPending ? <CircularProgress size={20} /> : null}
            >
              {isPending
                ? menuToEdit
                  ? "Updating..."
                  : "Creating..."
                : menuToEdit
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <IconPickerDialog
        open={iconPickerOpen}
        onClose={() => setIconPickerOpen(false)}
        onSelect={(iconName) => {
          setFormData((prev) => ({ ...prev, menuIcon: iconName }));
          // Clear error if exists
          if (errors.menuIcon) {
            setErrors((prev) => ({ ...prev, menuIcon: "" }));
          }
        }}
        currentIcon={formData.menuIcon}
      />
    </>
  );
};

export default AddMenusDialog;
