import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformAdmin } from './platform-admin-dashboard';

describe('PlatformAdmin', () => {
  let component: PlatformAdmin;
  let fixture: ComponentFixture<PlatformAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
