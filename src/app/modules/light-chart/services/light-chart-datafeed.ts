﻿import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { BaseWebsocketService } from '../../../shared/services/base-websocket.service';
import { WebsocketService } from '../../../shared/services/websocket.service';
import { HistoryService } from '../../../shared/services/history.service';
import { HistoryCallback, PeriodParams, TimeframeValue } from '../models/light-chart.models';
import { GuidGenerator } from '../../../shared/utils/guid';
import { BarsRequest } from '../models/bars-request.model';
import { Subscription, take } from 'rxjs';
import { Candle } from '../../../shared/models/history/candle.model';

export class LightChartDatafeed extends BaseWebsocketService {
  private readonly guid = GuidGenerator.newGuid();
  private lastHistoryPoint: number | null = null;
  private lastBarSubscription: Subscription | null = null;

  constructor(
    private readonly instrumentKey: InstrumentKey,
    private readonly timeFrame: TimeframeValue,
    ws: WebsocketService,
    private readonly historyService: HistoryService,
  ) {
    super(ws);
  }

  getHistory(
    periodParams: PeriodParams,
    onResult: HistoryCallback
  ): void {
    if (periodParams.firstDataRequest) {
      this.lastHistoryPoint = null;
    }

    this.historyService.getHistory({
      symbol: this.instrumentKey.symbol,
      exchange: this.instrumentKey.exchange,
      instrumentGroup: this.instrumentKey.instrumentGroup,
      from: periodParams.from,
      to: periodParams.to,
      tf: this.timeFrame
    }).pipe(
      take(1)
    ).subscribe(history => {
      if (!history) {
        return;
      }

      const dataIsEmpty = history.history.length === 0;

      if (periodParams.firstDataRequest) {
        this.lastHistoryPoint = dataIsEmpty
          ? this.getDefaultLastHistoryPoint(this.timeFrame)
          : history.history[history.history.length - 1].time;
      }

      onResult(
        history.history,
        {
          noData: dataIsEmpty,
          prevTime: history.prev
        }
      );
    });
  }

  subscribeBars(timeFrame: TimeframeValue, onResult: (candle: Candle) => void): void {
    this.lastBarSubscription?.unsubscribe();

    const request: BarsRequest = {
      opcode: 'BarsGetAndSubscribe',
      code: this.instrumentKey.symbol,
      exchange: this.instrumentKey.exchange,
      instrumentGroup: this.instrumentKey.instrumentGroup,
      format: 'simple',
      guid: this.guid,
      tf: timeFrame,
      from: this.lastHistoryPoint ?? this.getDefaultLastHistoryPoint(timeFrame)
    };

    this.lastBarSubscription = this.getEntity<Candle>(request).subscribe(candle => {
      if (!this.lastHistoryPoint || candle.time < this.lastHistoryPoint) {
        return;
      }

      onResult({
        ...candle,
        time: candle.time
      });
    });
  }

  private getDefaultLastHistoryPoint(timeFrame: TimeframeValue): number {
    const now = new Date();

    switch (timeFrame) {
      case TimeframeValue.Month:
      case TimeframeValue.Day:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))).getTime() / 1000;
      case TimeframeValue.H4:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours() - 4))).getTime() / 1000;
      case TimeframeValue.H:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours() - 1))).getTime() / 1000;
      case TimeframeValue.M15:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes() - 15))).getTime() / 1000;
      case TimeframeValue.M5:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes() - 5))).getTime() / 1000;
      case TimeframeValue.M1:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes() - 1))).getTime() / 1000;
      default:
        return now.getTime() / 1000;
    }
  }
}
