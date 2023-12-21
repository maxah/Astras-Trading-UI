import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { WidgetHeaderInstrumentSwitchComponent } from './widget-header-instrument-switch.component';
import { WidgetSettingsService } from "../../services/widget-settings.service";
import { Subject } from "rxjs";
import { InstrumentsService } from "../../../modules/instruments/services/instruments.service";
import { ACTIONS_CONTEXT } from "../../services/actions-context";

describe('WidgetHeaderInstrumentSwitchComponent', () => {
  let component: WidgetHeaderInstrumentSwitchComponent;
  let fixture: ComponentFixture<WidgetHeaderInstrumentSwitchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WidgetHeaderInstrumentSwitchComponent],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject()),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
          }
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstrument: jasmine.createSpy('getInstrument').and.returnValue(new Subject())
          }
        },
        {
          provide: ACTIONS_CONTEXT,
          useValue: {
            instrumentSelected: jasmine.createSpy('instrumentSelected').and.callThrough()
          }
        },
      ]
    });
    fixture = TestBed.createComponent(WidgetHeaderInstrumentSwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
