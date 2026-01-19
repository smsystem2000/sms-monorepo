import './sidebar.scss';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SuperAdminMenuItems, SchoolAdminMenuItems, TeachersMenuItems, StudentsMenuItems, ParentMenuItems } from './SidebarUtils';
import { Avatar, Toolbar, Typography, Divider } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import type { SideBarMenuItemType } from './SidebarUtils';
import TokenService from '../../queries/token/tokenService';
import { useUserStore } from '../../stores/userStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  role: string | null;
  onLogout?: () => void;
}

const Sidebar = ({ isOpen, onClose, role, onLogout }: SidebarProps) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [closingItem, setClosingItem] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoveredSubItem, setHoveredSubItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get user and school data from Zustand store
  const { user, fetchProfile } = useUserStore();

  // Fetch profile on component mount
  useEffect(() => {
    if (!user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

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

  const handleSelect = () => {
    // Close sidebar on mobile
    if (window.innerWidth <= 900) {
      onClose();
    }
  };

  // Check if menu item is selected based on current URL
  const isMenuItemSelected = (item: SideBarMenuItemType): boolean => {
    if (item.path && location.pathname === item.path) {
      return true;
    }
    if (item.subItems) {
      return item.subItems.some(subItem => location.pathname === subItem.path);
    }
    return false;
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

  // Get user's full name
  const userName = user ? `${user.firstName} ${user.lastName}` : TokenService.getUserName() || "User";
  const profileImage = user?.profileImage || '';


  return (
    <>
      <motion.div
        className={`sidebar ${isOpen ? 'open' : 'closed'}`}
        initial={false}
        animate={{
          width: isOpen ? 250 : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
          opacity: { duration: 0.25 }
        }}
        style={{
          zIndex: 9999,
          background: '#1e293b',
          boxShadow: isOpen ? '4px 0 20px rgba(30, 41, 59, 0.3)' : 'none',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* Fixed width inner container to prevent content wrapping during animation */}
        <motion.div
          style={{
            width: 250,
            minWidth: 250,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
          initial={false}
          animate={{
            opacity: isOpen ? 1 : 0,
            x: isOpen ? 0 : -20,
          }}
          transition={{
            duration: 0.25,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <Toolbar className="navbar-toolbar" />
          {/* User Profile Section */}
          <div
            className="sidebar-user-profile"
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
              alt={userName}
              src={profileImage}
              sx={{
                width: 60,
                height: 60,
                background: '#3b82f6',
                fontSize: '1.5rem',
                marginBottom: '10px',
              }}
            >
              {userName?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography style={{
              fontWeight: '600',
              color: 'white',
              fontSize: '1rem',
              whiteSpace: 'nowrap',
            }}>
              {userName}
            </Typography>
          </div>

          {/* Menu Items */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '16px',
            paddingBottom: '80px',
          }}>
            {menuItems.map((item: SideBarMenuItemType) => {
              const isHovered = hoveredItem === item.name;
              const isSelected = isMenuItemSelected(item);
              const backgroundColor = isSelected
                ? '#3b82f6'
                : isHovered
                  ? 'rgba(59, 130, 246, 0.2)'
                  : 'transparent';

              return (
                <div key={item.name}>
                  <div
                    onClick={() => {
                      if (item.isExpandable) {
                        handleToggle(item.name);
                      } else {
                        navigate(item.path!);
                        handleSelect();
                      }
                    }}
                    onMouseEnter={() => setHoveredItem(item.name)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`menu-item ${isSelected ? 'selected' : ''}`}
                    style={{
                      background: backgroundColor,
                      borderRadius: '8px',
                      marginBottom: '4px',
                      border: isSelected
                        ? '1px solid rgba(59, 130, 246, 0.3)'
                        : '1px solid transparent',
                      transition: 'all 0.2s ease',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
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
                      initial={false}
                      animate={{
                        height: (expandedItem === item.name || closingItem === item.name) ? 'auto' : 0,
                        opacity: expandedItem === item.name ? 1 : 0
                      }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '8px',
                        margin: '4px 0 4px 16px',
                        overflow: 'hidden',
                        border: '1px solid #334155',
                      }}
                    >
                      {(expandedItem === item.name || closingItem === item.name) && item.subItems?.map(subItem => {
                        const isSubItemActive = location.pathname === subItem.path;
                        const isSubItemHovered = hoveredSubItem === `${item.name}-${subItem.name}`;

                        const subItemBackground = isSubItemActive
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(96, 165, 250, 0.3) 100%)'
                          : isSubItemHovered
                            ? 'rgba(59, 130, 246, 0.15)'
                            : 'transparent';

                        return (
                          <div
                            key={subItem.name}
                            className={`sub-item ${isSubItemActive ? 'selected' : ''}`}
                            onClick={() => {
                              if (subItem.path) {
                                navigate(subItem.path);
                              }
                              handleSelect();
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
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
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
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Logout Button at Bottom */}
          {onLogout && (
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
                  whiteSpace: 'nowrap',
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
      </motion.div>
    </>
  );
}

export default Sidebar;