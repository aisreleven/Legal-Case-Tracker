import React from 'react';
import MainLayout from './MainLayout';

const AdminLayout = () => {
  return <MainLayout allowedRoles={['Admin']} />;
};

export default AdminLayout;
