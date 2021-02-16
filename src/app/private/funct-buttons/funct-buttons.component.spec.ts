import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FunctButtonsComponent } from './funct-buttons.component';

describe('FunctButtonsComponent', () => {
  let component: FunctButtonsComponent;
  let fixture: ComponentFixture<FunctButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FunctButtonsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FunctButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
