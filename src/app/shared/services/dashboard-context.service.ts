import { Injectable } from '@angular/core';
import {
  filter,
  Observable, switchMap,
  take
} from 'rxjs';
import { Store } from '@ngrx/store';
import {
  Dashboard,
  InstrumentGroups
} from '../models/dashboard/dashboard.model';
import { DashboardsStreams } from '../../store/dashboards/dashboards.streams';
import { PortfolioKey } from '../models/portfolio-key.model';
import { map } from 'rxjs/operators';
import { CurrentDashboardActions } from '../../store/dashboards/dashboards-actions';
import { InstrumentKey } from '../models/instruments/instrument-key.model';
import { DeviceService } from "./device.service";
import { MobileDashboardActions } from "../../store/mobile-dashboard/mobile-dashboard-actions";
import { MobileDashboardStreams } from "../../store/mobile-dashboard/mobile-dashboard.streams";
import { mapWith } from "../utils/observable-helper";

@Injectable({
  providedIn: 'root'
})
export class DashboardContextService {
  constructor(
    private readonly store: Store,
    private readonly deviceService: DeviceService,
  ) {
  }

  get selectedPortfolio$(): Observable<PortfolioKey> {
    return this.selectedDashboard$.pipe(
      map(d => d.selectedPortfolio),
      filter((p): p is PortfolioKey => !!p)
    );
  }

  get instrumentsSelection$(): Observable<InstrumentGroups> {
    return this.selectedDashboard$.pipe(
      map(d => d.instrumentsSelection),
      filter((g): g is InstrumentGroups => !!g)
    );
  }

  selectDashboardPortfolio(portfolioKey: PortfolioKey) {
    this.selectedDashboard$.pipe(
      mapWith(
        () => this.deviceService.deviceInfo$,
        (dashboard, deviceInfo) => ({ dashboard, isMobile: deviceInfo.isMobile })
      ),
      take(1)
    ).subscribe(({ dashboard, isMobile }) => {
      if (isMobile) {
        this.store.dispatch(MobileDashboardActions.selectPortfolio({ portfolioKey }));
      } else {
        this.store.dispatch(CurrentDashboardActions.selectPortfolio({ dashboardGuid: dashboard.guid, portfolioKey }));
      }
    });
  }

  selectDashboardInstrument(instrumentKey: InstrumentKey, groupKey: string) {
    this.selectedDashboard$.pipe(
      mapWith(
        () => this.deviceService.deviceInfo$,
        (dashboard, deviceInfo) => ({ dashboard, isMobile: deviceInfo.isMobile })
      ),
      take(1)
    ).subscribe(({ dashboard, isMobile }) => {
      if (isMobile) {
        this.store.dispatch(MobileDashboardActions.selectInstrument({
          selection: { groupKey, instrumentKey }
        }));
      } else {
        this.store.dispatch(CurrentDashboardActions.selectInstruments({
          dashboardGuid: dashboard.guid,
          selection: [{ groupKey, instrumentKey }]
        }));
      }
    });
  }

  get selectedDashboard$(): Observable<Dashboard> {
    return this.deviceService.deviceInfo$
      .pipe(
        switchMap(({ isMobile }) => isMobile
          ? MobileDashboardStreams.getMobileDashboard(this.store)
          : DashboardsStreams.getSelectedDashboard(this.store))
      );
  }
}
