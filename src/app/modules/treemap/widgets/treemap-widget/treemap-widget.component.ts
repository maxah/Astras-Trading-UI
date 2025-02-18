import { Component, Input, OnInit } from '@angular/core';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { TreemapSettings } from "../../models/treemap.model";
import { SettingsHelper } from "../../../../shared/utils/settings-helper";
import { Observable } from "rxjs";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";

@Component({
  selector: 'ats-treemap-widget',
  templateUrl: './treemap-widget.component.html',
  styleUrls: ['./treemap-widget.component.less']
})
export class TreemapWidgetComponent implements OnInit {
  @Input({required: true})
  widgetInstance!: WidgetInstance;
  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<TreemapSettings>;
  showBadge$!: Observable<boolean>;
  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<TreemapSettings>(
      this.widgetInstance,
      'TreemapSettings',
      settings => ({
        ...settings,
        badgeColor: defaultBadgeColor
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<TreemapSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }
}
