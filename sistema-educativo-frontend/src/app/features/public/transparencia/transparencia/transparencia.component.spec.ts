import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransparenciaComponent } from './transparencia.component';

describe('TransparenciaComponent', () => {
  let component: TransparenciaComponent;
  let fixture: ComponentFixture<TransparenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransparenciaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransparenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
