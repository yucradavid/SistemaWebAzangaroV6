import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleSquareComponent } from '../../../shared/components/module-square/module-square.component';
import { DOCENTE_MODULES } from '@core/constants/docente-modules';
import { AdminModuleEntry } from '@core/constants/admin-modules';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, ModuleSquareComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  modules: AdminModuleEntry[] = DOCENTE_MODULES;

  constructor() {}

  ngOnInit(): void {}
}
