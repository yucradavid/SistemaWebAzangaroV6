import { Injectable } from '@angular/core';
import { AdminModuleEntry } from '@core/constants/admin-modules';

@Injectable({
  providedIn: 'root'
})
export class NavigationStateService {
  private activeModule: AdminModuleEntry | null = null;

  setActiveModule(module: AdminModuleEntry | null) {
    this.activeModule = module;
    if (module) {
      localStorage.setItem('lastActiveModule', module.title);
    } else {
      localStorage.removeItem('lastActiveModule');
    }
  }

  getActiveModuleTitle(): string | null {
    return localStorage.getItem('lastActiveModule');
  }

  getActiveModule(): AdminModuleEntry | null {
    return this.activeModule;
  }
}
