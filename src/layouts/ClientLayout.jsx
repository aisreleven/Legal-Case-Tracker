import React from 'react';
import MainLayout from './MainLayout';

const ClientLayout = () => {
  return <MainLayout allowedRoles={['Client', 'Admin']} />;
};

export default ClientLayout;
