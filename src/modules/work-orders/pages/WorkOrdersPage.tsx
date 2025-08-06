import React from 'react';
import { MobileWorkOrderList } from '../components/MobileWorkOrderList';
import { WorkOrderList } from '../components/WorkOrderList';

const WorkOrdersPage: React.FC = () => {
  // Check if mobile device (basic responsive detection)
  const isMobile = window.innerWidth < 768;

  return isMobile ? <MobileWorkOrderList /> : <WorkOrderList />;
};

export default WorkOrdersPage;
