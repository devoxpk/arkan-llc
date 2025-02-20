'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import AdminServiceManager from './AdminServiceManager';

const AdminWrapper = () => {
  const searchParams = useSearchParams();
  const isEdit = searchParams.has('edit');

  useEffect(() => {
    if (isEdit) {
      const servicesElement = document.querySelector("#services");
      if (servicesElement) {
        servicesElement.remove();
      }
    }
  }, [isEdit]);

  return isEdit ? <AdminServiceManager /> : null;
};

export default AdminWrapper; 