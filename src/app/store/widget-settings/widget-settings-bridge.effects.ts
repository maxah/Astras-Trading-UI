import { Injectable } from '@angular/core';
import {
  Actions,
  createEffect
} from '@ngrx/effects';
import {
  distinctUntilChanged,
  filter,
  switchMap,
  take,
  withLatestFrom
} from "rxjs";
import { Store } from "@ngrx/store";
import { map } from "rxjs/operators";
import {
  getAllSettings,
  getInstrumentLinkedSettings,
  getPortfolioLinkedSettings,
  selectWidgetSettingsState
} from "./widget-settings.selectors";
import {
  setDefaultBadges,
  updateWidgetSettingsInstrument,
  updateWidgetSettingsPortfolio
} from "./widget-settings.actions";
import { EntityStatus } from "../../shared/models/enums/entity-status";
import {
  PortfolioKey,
  PortfolioKeyEqualityComparer
} from "../../shared/models/portfolio-key.model";
import { mapWith } from '../../shared/utils/observable-helper';
import { InstrumentEqualityComparer } from '../../shared/utils/instruments';
import { InstrumentKey } from '../../shared/models/instruments/instrument-key.model';
import { DashboardContextService } from "../../shared/services/dashboard-context.service";
import {TerminalSettingsStreams} from "../terminal-settings/terminal-settings.streams";
import {TerminalSettings} from "../../shared/models/terminal-settings/terminal-settings.model";

@Injectable()
export class WidgetSettingsBridgeEffects {
  newInstrumentSelected$ = createEffect(() => {
    const dashboardSettingsUpdate$ = this.dashboardContextService.selectedDashboard$.pipe(
      filter(d => !!d.instrumentsSelection),
      distinctUntilChanged((previous, current) =>
        previous.guid === current.guid
        && previous.items.length === current.items.length
        && JSON.stringify(previous?.instrumentsSelection) === JSON.stringify(current.instrumentsSelection)
      ),
      mapWith(() => this.store.select(getInstrumentLinkedSettings), (d, settings) => ({ d, settings })),
      map(({ d, settings }) => {
        const dashboardWidgetGuids = d.items.map(x => x.guid);
        const settingsToUpdate = settings
          .filter(s => dashboardWidgetGuids.includes(s.guid))
          .map(s => ({ guid: s.guid, groupKey: s.badgeColor!, instrumentKey: (<any>s) as InstrumentKey }))
          .filter(s => !InstrumentEqualityComparer.equals(d.instrumentsSelection![s.groupKey], s.instrumentKey));

        return {
          settingsToUpdate,
          instrumentsSelection: d.instrumentsSelection!
        };
      }),
      filter(changes => changes.settingsToUpdate.length > 0),
      map(changes => updateWidgetSettingsInstrument({
        updates: changes.settingsToUpdate.map(u => ({
          guid: u.guid,
          instrumentKey: changes.instrumentsSelection[u.groupKey]
        }))
      }))
    );

    return this.store.select(selectWidgetSettingsState).pipe(
      filter(x => x.status === EntityStatus.Success),
      take(1),
      switchMap(() => dashboardSettingsUpdate$),
    );
  });

  newPortfolioSelected$ = createEffect(() => {
    const dashboardSettingsUpdate$ = this.dashboardContextService.selectedDashboard$.pipe(
      filter(d => !!d.selectedPortfolio),
      distinctUntilChanged((previous, current) => PortfolioKeyEqualityComparer.equals(previous?.selectedPortfolio, current?.selectedPortfolio)),
      mapWith(() => this.store.select(getPortfolioLinkedSettings), (d, settings) => ({ d, settings })),
      map(({ d, settings }) => {
        const dashboardWidgetGuids = d.items.map(x => x.guid);
        const settingsToUpdate = settings
          .filter(s => dashboardWidgetGuids.includes(s.guid))
          .filter(s => !PortfolioKeyEqualityComparer.equals(d.selectedPortfolio, (<any>s) as PortfolioKey));

        return {
          settingsToUpdate,
          portfolioKey: d.selectedPortfolio!
        };
      }),
      filter(changes => changes.settingsToUpdate.length > 0),
      map(changes => updateWidgetSettingsPortfolio({
        settingGuids: changes.settingsToUpdate.map(s => s.guid),
        newPortfolioKey: changes.portfolioKey
      }))
    );

    return this.store.select(selectWidgetSettingsState).pipe(
      filter(x => x.status === EntityStatus.Success),
      take(1),
      switchMap(() => dashboardSettingsUpdate$),
    );
  });

  terminalSettingsChange$ = createEffect(() => {
    return TerminalSettingsStreams.getSettings(this.store)
      .pipe(
        withLatestFrom(this.store.select(getAllSettings)
          .pipe(
            map(ws => ws.filter(s => !!s.badgeColor).map(s => s.guid))
          )
        ),
        map(([ts, settingGuids]: [TerminalSettings, string[]]) => {
          if (!ts.badgesBind) {
            return setDefaultBadges({ settingGuids });
          }
          return setDefaultBadges({ settingGuids: [] });
        }),
      );
  });

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store,
    private readonly dashboardContextService: DashboardContextService
  ) {
  }
}
