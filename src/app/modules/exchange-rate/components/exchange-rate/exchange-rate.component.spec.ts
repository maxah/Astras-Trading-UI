import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ExchangeRateComponent } from './exchange-rate.component';
import { ExchangeRateService } from "../../../../shared/services/exchange-rate.service";
import {
  of,
  Subject
} from "rxjs";
import { QuotesService } from '../../../../shared/services/quotes.service';
import { MarketService } from "../../../../shared/services/market.service";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { ACTIONS_CONTEXT } from "../../../../shared/services/actions-context";

describe('ExchangeRateComponent', () => {
  let component: ExchangeRateComponent;
  let fixture: ComponentFixture<ExchangeRateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExchangeRateComponent],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: ExchangeRateService,
          useValue: {
            getCurrencyPairs: jasmine.createSpy('getCurrencyPairs').and.returnValue(of([]))
          }
        },
        {
          provide: QuotesService,
          useValue: {
            getQuotes: jasmine.createSpy('getQuotes').and.returnValue(new Subject())
          }
        },
        {
          provide: MarketService,
          useValue: {
            getMarketSettings: jasmine.createSpy('getMarketSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: ACTIONS_CONTEXT,
          useValue: {
            instrumentSelected: jasmine.createSpy('instrumentSelected').and.callThrough()
          }
        },
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExchangeRateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
