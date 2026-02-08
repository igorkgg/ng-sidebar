import { NgModule } from '@angular/core';

import { SidebarContainer } from './sidebar-container.component';
import { Sidebar } from './sidebar.component';
import { CloseSidebar } from './close.directive';

@NgModule({
  imports: [SidebarContainer, Sidebar, CloseSidebar],
  exports: [SidebarContainer, Sidebar, CloseSidebar]
})
export class SidebarModule {}
