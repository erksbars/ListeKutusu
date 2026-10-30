"use client";
import { createContext, useContext, type ReactNode } from "react";
const HeaderNavigationContext = createContext(false);
export function HeaderNavigationProvider({ children }: { children: ReactNode }) { return <HeaderNavigationContext.Provider value>{children}</HeaderNavigationContext.Provider>; }
export function useHeaderNavigation() { return useContext(HeaderNavigationContext); }
