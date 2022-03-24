import { Component, Input, Output, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { ModalService } from 'src/app/shared/services/modal.service';
import { getTypeBySettings, isInstrumentDependent, isPortfolioDependent } from 'src/app/shared/utils/settings-helper';
import { AnySettings } from '../../../../shared/models/settings/any-settings.model';


@Component({
  selector: 'ats-widget-header[guid][hasSettings][hasHelp]',
  templateUrl: './widget-header.component.html',
  styleUrls: ['./widget-header.component.less']
})
export class WidgetHeaderComponent implements OnInit, OnDestroy {
  @Input()
  guid!: string;
  @Input()
  hasSettings!: boolean;
  @Input()
  hasHelp!: boolean;
  @Output()
  switchSettingsEvent = new EventEmitter<boolean>();
  @Output()
  linkChangedEvent = new EventEmitter<boolean>();

  private shouldShowSettings = false;
  private dashboardSub?: Subscription;
  private selectedSub?: Subscription;
  settings$?: Observable<AnySettings>;
  private settings?: AnySettings

  constructor(private dashboard: DashboardService, private modal: ModalService) { }

  ngOnInit() {
    this.settings$ = this.dashboard.getSettings(this.guid).pipe(
      filter((s) : s is AnySettings => !!s),
      map(s => {
        this.settings = s;
        const prefix = s.title?.split(' ')[0] ?? '';
        if (isInstrumentDependent(s)) {
          const group = s.instrumentGroup;
          s.title = `${prefix} ${s.symbol} ${group ? '(' + group + ')' : ''}`;
        }
        else if (isPortfolioDependent(s)) {
          s.title = `${prefix} ${s.portfolio} (${s.exchange})`
        }
        return s;
      }),
    )
  }

  ngOnDestroy() {
    this.dashboardSub?.unsubscribe();
    this.selectedSub?.unsubscribe();
  }

  switchSettings($event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();
    this.shouldShowSettings = !this.shouldShowSettings;
    this.switchSettingsEvent.emit(this.shouldShowSettings)
  }

  removeItem($event: MouseEvent | TouchEvent): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.dashboard.removeWidget(this.guid);
  }

  linkToActive($event: MouseEvent | TouchEvent, linkToActive: boolean) : void {
    $event.preventDefault();
    $event.stopPropagation();
    if (this.settings) {
      this.dashboard.updateSettings(this.guid, { ...this.settings, linkToActive: linkToActive });
    }
  }

  openHelp() {
    if (this.settings) {
      const name = getTypeBySettings(this.settings)
      this.modal.openHelpModal(name);
    }
  }
}
