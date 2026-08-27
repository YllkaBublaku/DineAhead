import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OauthRedirect } from './oauth-redirect';

describe('OauthRedirect', () => {
  let component: OauthRedirect;
  let fixture: ComponentFixture<OauthRedirect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OauthRedirect],
    }).compileComponents();

    fixture = TestBed.createComponent(OauthRedirect);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
