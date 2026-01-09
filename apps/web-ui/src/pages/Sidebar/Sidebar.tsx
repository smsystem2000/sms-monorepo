import './sidebar.scss';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SuperAdminMenuItems, SchoolAdminMenuItems, TeachersMenuItems, StudentsMenuItems, ParentMenuItems } from './SidebarUtils';
import { Avatar, Toolbar, Typography, Divider } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import type { SideBarMenuItemType } from './SidebarUtils';
import TokenService from '../../queries/token/tokenService';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  role: string | null;
  onLogout?: () => void;
}

const Sidebar = ({ isOpen, onClose, role, onLogout }: SidebarProps) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>('Dashboard');
  const [closingItem, setClosingItem] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoveredSubItem, setHoveredSubItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (closingItem) {
      const timer = setTimeout(() => {
        setClosingItem(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [closingItem]);

  const handleToggle = (itemName: string) => {
    if (expandedItem && expandedItem !== itemName) {
      setClosingItem(expandedItem);
    }
    setExpandedItem(prev => prev === itemName ? null : itemName);
  };

  const handleSelect = (itemName: string) => {
    setSelectedItem(itemName);
    // Close sidebar on mobile
    if (window.innerWidth <= 900) {
      onClose();
    }
  };

  // Updated menu items logic based on role
  const getMenuItems = () => {
    switch (role) {
      case "super_admin":
        return SuperAdminMenuItems;
      case "sch_admin":
        return SchoolAdminMenuItems;
      case "teacher":
        return TeachersMenuItems;
      case "student":
        return StudentsMenuItems;
      case "parent":
        return ParentMenuItems;
      default:
        return SuperAdminMenuItems;
    }
  };

  const menuItems = getMenuItems();

  // Get logged-in user's name from token
  const userName = TokenService.getUserName();
  const name = userName || "User";

  return (
    <>

      <motion.div
        className={`sidebar ${isOpen ? 'open' : 'closed'}`}
        initial={{ width: 0 }}
        animate={{ width: isOpen ? 250 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{
          zIndex: 100,
          background: '#1e293b',
          boxShadow: isOpen ? '4px 0 20px rgba(30, 41, 59, 0.3)' : 'none',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar className="navbar-toolbar" />
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="sidebar-header"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{
                padding: '20px',
                borderBottom: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <Avatar
                alt="User Avatar"
                src={''}
                sx={{
                  width: 60,
                  height: 60,
                  background: '#3b82f6',
                  fontSize: '1.5rem',
                  marginBottom: '10px',
                }}
              >
                {name?.charAt(0).toUpperCase()}
              </Avatar>
              <div className="welcome-text" style={{ color: '#fff' }}>
                <Typography style={{
                  fontWeight: '600',
                  color: 'white',
                  fontSize: '1rem',
                }}>
                  {name}
                </Typography>
                <Typography style={{
                  color: '#94a3b8',
                  fontSize: '0.75rem',
                  textTransform: 'capitalize',
                }}>
                  {role?.replace('_', ' ') || 'User'}
                </Typography>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu Items */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          paddingBottom: '80px',
        }}>
          <AnimatePresence>
            {menuItems.map((item: SideBarMenuItemType) => {
              const isHovered = hoveredItem === item.name;
              const isSelected = selectedItem === item.name;
              const backgroundColor = isSelected
                ? '#3b82f6'
                : isHovered
                  ? 'rgba(59, 130, 246, 0.2)'
                  : 'transparent';

              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    onClick={() => {
                      if (item.isExpandable) {
                        handleToggle(item.name);
                      } else {
                        navigate(item.path!);
                        handleSelect(item.name);
                      }
                    }}
                    onMouseEnter={() => setHoveredItem(item.name)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`menu-item ${selectedItem === item.name ? 'selected' : ''}`}
                    style={{
                      background: backgroundColor,
                      borderRadius: '8px',
                      marginBottom: '4px',
                      border: isSelected
                        ? '1px solid rgba(59, 130, 246, 0.3)'
                        : '1px solid transparent',
                      transition: 'all 0.3s ease',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      color: isSelected ? 'white' : '#cbd5e1',
                      fontWeight: isSelected ? '600' : '500',
                      flex: 1,
                    }}>
                      {item.icon}
                      <span style={{ flex: 1 }}>{item.name}</span>
                    </span>
                    {item.isExpandable && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(item.name);
                        }}
                      >
                        {expandedItem === item.name ? <ExpandLess /> : <ExpandMore />}
                      </span>
                    )}
                  </div>
                  {item.isExpandable && (
                    <motion.div
                      className="sub-items"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: (expandedItem === item.name || closingItem === item.name) ? 'auto' : 0,
                        opacity: expandedItem === item.name ? 1 : 0
                      }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '8px',
                        margin: '4px 0 4px 16px',
                        overflow: 'hidden',
                        border: '1px solid #334155',
                      }}
                    >
                      <AnimatePresence>
                        {(expandedItem === item.name || closingItem === item.name) && item.subItems?.map(subItem => {
                          const isSubItemActive = location.pathname === subItem.path;
                          const isSubItemHovered = hoveredSubItem === `${item.name}-${subItem.name}`;

                          const subItemBackground = isSubItemActive
                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(96, 165, 250, 0.3) 100%)'
                            : isSubItemHovered
                              ? 'rgba(59, 130, 246, 0.15)'
                              : 'transparent';

                          return (
                            <motion.div
                              key={subItem.name}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div
                                className={`sub-item ${isSubItemActive ? 'selected' : ''}`}
                                onClick={() => {
                                  if (subItem.path) {
                                    navigate(subItem.path);
                                  }
                                  handleSelect(item.name);
                                }}
                                onMouseEnter={() => setHoveredSubItem(`${item.name}-${subItem.name}`)}
                                onMouseLeave={() => setHoveredSubItem(null)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '10px 16px',
                                  color: isSubItemActive
                                    ? 'white'
                                    : '#94a3b8',
                                  background: subItemBackground,
                                  borderRadius: '6px',
                                  margin: '2px 8px',
                                  textDecoration: 'none',
                                  transition: 'all 0.3s ease',
                                  cursor: 'pointer',
                                }}
                              >
                                <span className="sub-item-icon" style={{
                                  color: isSubItemActive
                                    ? 'white'
                                    : '#94a3b8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '20px',
                                }}>
                                  {subItem.icon}
                                </span>
                                <span className="sub-item-name" style={{
                                  fontWeight: isSubItemActive ? '600' : '500',
                                  fontSize: '0.875rem',
                                  flex: 1,
                                }}>
                                  {subItem.name}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Logout Button at Bottom */}
        {isOpen && onLogout && (
          <div style={{ padding: '16px' }}>
            <Divider sx={{ borderColor: '#334155', mb: 2 }} />
            <div
              onClick={onLogout}
              className="menu-item"
              style={{
                background: 'transparent',
                borderRadius: '8px',
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#ef4444',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flex: 1,
              }}>
                <LogoutIcon />
                <span>Logout</span>
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}

export default Sidebar;