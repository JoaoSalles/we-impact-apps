import { Outlet } from 'react-router'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'

export function RootLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SidebarTrigger />
        <div className='p-md'>
          <Outlet/>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}