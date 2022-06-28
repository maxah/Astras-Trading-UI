import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable} from 'rxjs';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { ExchangeInfo } from '../../models/exchange-info.model';
import { InfoService } from '../../services/info.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";

@Component({
  selector: 'ats-info-widget',
  templateUrl: './info-widget.component.html',
  styleUrls: ['./info-widget.component.less'],
  providers: [ InfoService ]
})
export class InfoWidgetComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  set linkedToActive(linkedToActive: boolean) {
    this.settingsService.updateIsLinked(this.guid, linkedToActive);
  }
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;

  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  info$?: Observable<ExchangeInfo | null>;

  constructor(private readonly service: InfoService, private readonly settingsService: WidgetSettingsService) { }

  ngOnInit(): void {
    this.service.init(this.guid);
    this.info$ = this.service.getExchangeInfo();
  }
}
