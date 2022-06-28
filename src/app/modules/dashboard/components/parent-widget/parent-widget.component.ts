import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { Widget } from 'src/app/shared/models/widget.model';
import {
  Observable,
  Subject,
  takeUntil
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { AnySettings } from "../../../../shared/models/settings/any-settings.model";
import { map } from "rxjs/operators";

@Component({
  selector: 'ats-parent-widget[widget][resize]',
  templateUrl: './parent-widget.component.html',
  styleUrls: ['./parent-widget.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParentWidgetComponent implements OnInit, OnDestroy {
  @Input()
  widget!: Widget;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  widgetResize: EventEmitter<DashboardItem> = new EventEmitter<DashboardItem>();
  shouldShowSettings: boolean = false;
  isLinked$?: Observable<boolean>;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private readonly settingsService: WidgetSettingsService) {
  }

  get contentHeightAdjustment(): number {
    // TODO: need to calculate this value. Now it depends on styles
    return 40;
  }

  ngOnInit(): void {
    this.resize.pipe(
      takeUntil(this.destroy$)
    ).subscribe(i => {
      if (i.label == this.widget.gridItem.label) {
        this.widgetResize.emit(i);
      }
    });

    this.isLinked$ = this.settingsService.getSettings<AnySettings>(this.getGuid()).pipe(
      map(s => s.linkToActive ?? false)
    );
  }

  onSwitchSettings(value: boolean) {
    this.shouldShowSettings = value;
  }

  onLinkedChanged(isLinked: boolean) {
    this.settingsService.updateIsLinked(this.getGuid(), isLinked);
  }

  getGuid() {
    const obWidget = this.widget as Widget;
    return obWidget.guid;
  }

  hasSettings() {
    const obWidget = this.widget as Widget;
    return obWidget.hasSettings;
  }

  hasHelp() {
    const obWidget = this.widget as Widget;
    return obWidget.hasHelp;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
