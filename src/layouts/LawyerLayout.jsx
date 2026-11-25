import React from 'react';
import MainLayout from './MainLayout';

const LawyerLayout = () => {
  return <MainLayout allowedRoles={['Lawyer', 'Admin']} />;
};

export default LawyerLayout;
