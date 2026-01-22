import { useState } from "react";
import { Box, Chip, IconButton, Tooltip } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import DataTable, { type Column } from "../../components/Table/DataTable";
import AddMenusDialog from "../../components/Dialogs/AddMenusDialog";
import ConfirmationDialog from "../../components/Dialogs/ConfirmationDialog";
import { useGetMenus, useDeleteMenu } from "../../queries/Menus";
import type { Menu } from "../../types";

const Menus = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | undefined>(undefined);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);

  // Fetch menus
  const { data: menusData, isLoading, error } = useGetMenus();
  const menus = menusData?.data || [];

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
      <DataTable<Menu>
        title="Menus Management"
        columns={columns}
        data={menus}
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
