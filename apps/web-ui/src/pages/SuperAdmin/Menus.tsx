import { useState, useMemo } from "react";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Autocomplete,
  Grid,
  InputAdornment,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import DataTable, { type Column } from "../../components/Table/DataTable";
import AddMenusDialog from "../../components/Dialogs/AddMenusDialog";
import ConfirmationDialog from "../../components/Dialogs/ConfirmationDialog";
import { useGetMenus, useDeleteMenu } from "../../queries/Menus";
import { useGetSchools } from "../../queries/School";
import type { Menu } from "../../types";

const Menus = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | undefined>(undefined);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);

  // Fetch menus and schools
  const { data: menusData, isLoading: isLoadingMenus, error } = useGetMenus();
  const { data: schoolsData, isLoading: isLoadingSchools } = useGetSchools();

  const menus = menusData?.data || [];
  const schools = schoolsData?.data || [];

  // Filter menus based on search term and selected school
  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      // School filter
      if (selectedSchool && menu.schoolId !== selectedSchool) {
        return false;
      }

      // Search filter (menuName, roles, menuOrder)
      const term = searchTerm.trim().toLowerCase();
      if (term) {
        const nameMatch = menu.menuName.toLowerCase().includes(term);
        const orderMatch =
          menu.menuOrder && String(menu.menuOrder).toLowerCase().includes(term);

        const roles = Array.isArray(menu.menuAccessRoles)
          ? menu.menuAccessRoles
          : [menu.menuAccessRoles];
        const roleMatch = roles.some(
          (role: string) => role && role.toLowerCase().includes(term),
        );

        if (!nameMatch && !roleMatch && !orderMatch) {
          return false;
        }
      }

      return true;
    });
  }, [menus, searchTerm, selectedSchool]);

  const isLoading = isLoadingMenus || isLoadingSchools;

  const handleAddClick = () => {
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setSelectedMenu(undefined);
  };

  const deleteMutation = useDeleteMenu();

  const handleEditClick = (menu: Menu) => {
    setSelectedMenu(menu);
    setIsAddDialogOpen(true);
  };

  const handleDeleteClick = (menu: Menu) => {
    setMenuToDelete(menu);
    setDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (menuToDelete) {
      try {
        await deleteMutation.mutateAsync(menuToDelete.menuId);
        setDeleteConfirmationOpen(false);
        setMenuToDelete(null);
      } catch (err) {
        console.error("Failed to delete menu:", err);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmationOpen(false);
    setMenuToDelete(null);
  };

  const columns: Column<Menu>[] = [
    { id: "menuName", label: "Menu Name", minWidth: 150 },
    {
      id: "menuOrder",
      label: "Order",
      minWidth: 100,
      format: (value: any) => {
        if (!value) return null;
        // Handle array or string
        const orders = Array.isArray(value) ? value : [value];

        return (
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {orders.map((orderItem: string) => {
              const order = String(orderItem);
              let color:
                | "default"
                | "primary"
                | "secondary"
                | "error"
                | "info"
                | "success"
                | "warning" = "default";

              // Derive color from prefix (SA -> Super Admin, A -> School Admin, etc.)
              if (order.startsWith("SA"))
                color = "error"; // super_admin
              else if (order.startsWith("A"))
                color = "primary"; // sch_admin
              else if (order.startsWith("T"))
                color = "warning"; // teacher
              else if (order.startsWith("S"))
                color = "success"; // student
              else if (order.startsWith("P")) color = "warning"; // parent

              return (
                <Chip
                  key={order}
                  label={order}
                  size="small"
                  variant="outlined"
                  color={color}
                  sx={{ fontWeight: 600, minWidth: "50px" }}
                />
              );
            })}
          </Box>
        );
      },
    },
    { id: "menuUrl", label: "Path", minWidth: 150 },
    {
      id: "menuType",
      label: "Menu Type",
      minWidth: 120,
      format: (value: any) => (
        <Chip
          label={value === "main" ? "Main Menu" : "Sub Menu"}
          size="small"
          color={value === "main" ? "primary" : "secondary"}
          variant="outlined"
          sx={{
            fontWeight: 600,
            textTransform: "capitalize",
            minWidth: "90px",
          }}
        />
      ),
    },

    {
      id: "menuAccessRoles",
      label: "Role",
      minWidth: 200,
      format: (value: any) => {
        if (!value) return null;
        const roles = Array.isArray(value) ? value : [value];
        return (
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {roles.map((role: string) => {
              let color:
                | "default"
                | "primary"
                | "secondary"
                | "error"
                | "info"
                | "success"
                | "warning" = "default";
              switch (role) {
                case "super_admin":
                  color = "error";
                  break;
                case "sch_admin":
                  color = "primary";
                  break;
                case "teacher":
                  color = "warning";
                  break;
                case "student":
                  color = "success";
                  break;
                case "parent":
                  color = "warning";
                  break;
                default:
                  color = "default";
              }
              return (
                <Chip
                  key={role}
                  label={role.replace(/_/g, " ")}
                  size="small"
                  variant="filled"
                  color={color}
                  sx={{ textTransform: "capitalize", fontWeight: 500 }}
                />
              );
            })}
          </Box>
        );
      },
    },
    {
      id: "schoolId",
      label: "School ID",
      minWidth: 100,
      hide: "sm",
    },
    {
      id: "actions",
      label: "Action",
      minWidth: 100,
      format: (_: any, row: Menu) => (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(row);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(row);
              }}
              disabled={deleteMutation.isPending}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* Filters Section */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search menus or roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={schools}
              getOptionLabel={(school: any) => school.schoolName || ""}
              value={
                schools.find((s: any) => s.schoolId === selectedSchool) || null
              }
              onChange={(_event, newValue) => {
                setSelectedSchool(newValue ? newValue.schoolId : null);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter by School"
                  variant="outlined"
                  size="small"
                  placeholder="Select a school"
                />
              )}
              fullWidth
            />
          </Grid>
        </Grid>
      </Box>

      <DataTable<Menu>
        title="Menus Management"
        columns={columns}
        data={filteredMenus}
        isLoading={isLoading}
        error={error ? (error as any).message : null}
        onAddClick={handleAddClick}
        addButtonLabel="Add Menu"
      />

      <AddMenusDialog
        open={isAddDialogOpen}
        onClose={handleCloseDialog}
        menuToEdit={selectedMenu}
      />

      <ConfirmationDialog
        open={deleteConfirmationOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Menu"
        description={`Are you sure you want to delete the menu "${menuToDelete?.menuName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default Menus;
