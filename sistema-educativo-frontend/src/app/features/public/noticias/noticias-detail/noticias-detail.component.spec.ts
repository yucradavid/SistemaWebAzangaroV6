import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoticiasDetailComponent } from './noticias-detail.component';

describe('NoticiasDetailComponent', () => {
  let component: NoticiasDetailComponent;
  let fixture: ComponentFixture<NoticiasDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoticiasDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoticiasDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
