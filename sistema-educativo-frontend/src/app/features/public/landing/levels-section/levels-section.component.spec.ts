import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LevelsSectionComponent } from './levels-section.component';

describe('LevelsSectionComponent', () => {
  let component: LevelsSectionComponent;
  let fixture: ComponentFixture<LevelsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LevelsSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LevelsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
