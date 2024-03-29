import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModChatComponent } from './mod-chat.component';

describe('ModChatComponent', () => {
  let component: ModChatComponent;
  let fixture: ComponentFixture<ModChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModChatComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
