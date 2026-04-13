"use client";

import React from 'react';

// Session loading is handled by AuthGuard in the dashboard layout.
// This provider is kept as a mount point for future global providers.
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
