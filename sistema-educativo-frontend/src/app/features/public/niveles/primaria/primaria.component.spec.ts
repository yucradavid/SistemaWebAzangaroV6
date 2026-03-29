import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrimariaComponent } from './primaria.component';

describe('PrimariaComponent', () => {
  let component: PrimariaComponent;
  let fixture: ComponentFixture<PrimariaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimariaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrimariaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
