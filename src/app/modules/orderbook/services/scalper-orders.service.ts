import { Injectable } from '@angular/core';
import {
  CurrentOrder,
  ScalperOrderBookRow,
  ScalperOrderBookRowType
} from "../models/scalper-order-book.model";
import { OrderCancellerService } from "../../../shared/services/order-canceller.service";
import { CancelCommand } from "../../../shared/models/commands/cancel-command.model";
import {
  Observable,
  take
} from "rxjs";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import {
  filter,
  map
} from "rxjs/operators";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { Position } from "../../../shared/models/positions/position.model";
import { PositionsService } from "../../../shared/services/positions.service";
import { OrderService } from "../../../shared/services/orders/order.service";
import { Side } from "../../../shared/models/enums/side.model";
import { mapWith } from "../../../shared/utils/observable-helper";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { ModalService } from "../../../shared/services/modal.service";
import { StopOrderCondition } from "../../../shared/models/enums/stoporder-conditions";
import {
  LimitOrder,
  MarketOrder,
  StopLimitOrder,
  StopMarketOrder
} from "../../command/models/order.model";
import { CommandType } from "../../../shared/models/enums/command-type.model";
import { OrderbookData } from '../models/orderbook-data.model';
import { Instrument } from '../../../shared/models/instruments/instrument.model';
import { DashboardContextService } from '../../../shared/services/dashboard-context.service';

@Injectable({
  providedIn: 'root'
})
export class ScalperOrdersService {

  constructor(
    private readonly orderCancellerService: OrderCancellerService,
    private readonly positionsService: PositionsService,
    private readonly orderService: OrderService,
    private readonly notification: NzNotificationService,
    private readonly modal: ModalService,
    private readonly currentDashboardService: DashboardContextService
  ) {
  }

  cancelOrders(currentOrders: CurrentOrder[]): void {
    for (const order of currentOrders) {
      const command: CancelCommand = {
        orderid: order.orderId,
        exchange: order.exchange,
        portfolio: order.portfolio,
        stop: false
      };

      this.orderCancellerService.cancelOrder(command).pipe(
        take(1)
      ).subscribe();
    }
  }

  closePositionsByMarket(instrumentKey: InstrumentKey): void {
    this.getCurrentPositionsWithPortfolio(instrumentKey)
      .subscribe(({ portfolio, position }) => {
        if (!position || !position.qtyTFutureBatch) {
          return;
        }

        this.orderService.submitMarketOrder({
            side: position.qtyTFutureBatch > 0 ? Side.Sell : Side.Buy,
            quantity: Math.abs(position.qtyTFutureBatch),
            instrument: instrumentKey,
          },
          portfolio.portfolio
        ).subscribe();
      });
  }

  placeBestOrder(instrument: Instrument, side: Side, quantity: number, orderBook: OrderbookData): void {
    if (orderBook.a.length === 0 || orderBook.b.length === 0) {
      return;
    }

    let price: number | undefined;

    const bestAsk = orderBook.a[0].p;
    const bestBid = orderBook.b[0].p;

    if ((bestAsk - bestBid) > instrument.minstep) {
      price = side === Side.Sell
        ? bestAsk - instrument.minstep
        : bestBid + instrument.minstep;
    }
    else {
      price = side === Side.Sell
        ? bestAsk
        : bestBid;
    }

    if (price != undefined) {
      this.getCurrentPortfolio().subscribe(portfolio => {
        this.orderService.submitLimitOrder({
            side: side,
            price: price!,
            quantity: quantity,
            instrument: instrument
          },
          portfolio.portfolio)
          .subscribe();
      });
    }
  }

  sellBestBid(instrument: Instrument, quantity: number, orderBook: OrderbookData): void {
    if (orderBook.b.length === 0) {
      return;
    }

    const bestBid = orderBook.b[0].p;
    this.getCurrentPortfolio().subscribe(portfolio => {
      this.orderService.submitLimitOrder({
          side: Side.Sell,
          price: bestBid!,
          quantity: quantity,
          instrument: instrument
        },
        portfolio.portfolio)
        .subscribe();
    });
  }

  buyBestAsk(instrument: Instrument, quantity: number, orderBook: OrderbookData): void {
    if (orderBook.a.length === 0) {
      return;
    }

    const bestAsk = orderBook.a[0].p;
    this.getCurrentPortfolio().subscribe(portfolio => {
      this.orderService.submitLimitOrder({
          side: Side.Buy,
          price: bestAsk!,
          quantity: quantity,
          instrument: instrument
        },
        portfolio.portfolio)
        .subscribe();
    });
  }

  placeMarketOrder(instrumentKey: InstrumentKey, side: Side, quantity: number, silent: boolean): void {
    this.getCurrentPortfolio()
      .subscribe(portfolio => {
        const order: MarketOrder = {
          side: side,
          quantity: quantity,
          instrument: instrumentKey
        };

        if (silent) {
          this.orderService.submitMarketOrder(order, portfolio.portfolio).subscribe();
        }
        else {
          this.modal.openCommandModal({
            ...order,
            type: CommandType.Market
          });
        }
      });
  }

  placeLimitOrder(instrumentKey: InstrumentKey, side: Side, quantity: number, price: number, silent: boolean) {
    this.getCurrentPortfolio()
      .subscribe(portfolio => {
        const order: LimitOrder = {
          side: side,
          quantity: quantity,
          price: price,
          instrument: instrumentKey
        };

        if (silent) {
          this.orderService.submitLimitOrder(order, portfolio.portfolio).subscribe();
        }
        else {
          this.modal.openCommandModal({
            ...order,
            type: CommandType.Limit
          });
        }
      });
  }

  reversePositionsByMarket(instrumentKey: InstrumentKey): void {
    this.getCurrentPositionsWithPortfolio(instrumentKey)
      .subscribe(({ portfolio, position }) => {
        if (!position || !position.qtyTFutureBatch) {
          return;
        }

        this.orderService.submitMarketOrder({
            side: position.qtyTFutureBatch > 0 ? Side.Sell : Side.Buy,
            quantity: Math.abs(position.qtyTFutureBatch * 2),
            instrument: instrumentKey,
          },
          portfolio.portfolio
        ).subscribe();
      });
  }

  setStopLimitForRow(instrumentKey: InstrumentKey, row: ScalperOrderBookRow, quantity: number, silent: boolean): void {
    if (row.rowType != ScalperOrderBookRowType.Bid && row.rowType != ScalperOrderBookRowType.Ask) {
      return;
    }

    this.getCurrentPortfolio()
      .subscribe(portfolio => {
        const side = row.rowType === ScalperOrderBookRowType.Ask
          ? Side.Sell
          : Side.Buy;

        const order: StopLimitOrder = {
          side: side,
          quantity: quantity,
          price: row.price,
          instrument: instrumentKey,
          triggerPrice: row.price,
          condition: side === Side.Sell ? StopOrderCondition.More : StopOrderCondition.Less,
        };

        if (silent) {
          this.orderService.submitStopLimitOrder(order, portfolio.portfolio).subscribe();
        }
        else {
          this.modal.openCommandModal({
            ...order,
            type: CommandType.Stop,
            stopEndUnixTime: undefined
          });
        }
      });
  }

  setStopLoss(instrumentKey: InstrumentKey, price: number, silent: boolean): void {
    this.getCurrentPositionsWithPortfolio(instrumentKey)
      .subscribe(({ portfolio, position }) => {
        if (!position || position.qtyTFutureBatch === 0 || !position.avgPrice) {
          this.notification.error('Нет позиций', 'Позиции для установки стоп-лосс отсутствуют');
          return;
        }

        const side = position.qtyTFutureBatch < 0 ? Side.Buy : Side.Sell;

        if (side === Side.Sell && price >= position.avgPrice) {
          this.notification.warning('Некорректная цена', `Для установки стоп-лосс цена должна быть меньше ${position.avgPrice}`);
          return;
        }

        if (side === Side.Buy && price <= position.avgPrice) {
          this.notification.warning('Некорректная цена', `Для установки стоп-лосс цена должна быть больше ${position.avgPrice}`);
          return;
        }

        const order: StopMarketOrder = {
          side: side,
          quantity: Math.abs(position.qtyTFutureBatch),
          instrument: instrumentKey,
          triggerPrice: price,
          condition: side === Side.Sell ? StopOrderCondition.Less : StopOrderCondition.More
        };

        if (silent) {
          this.orderService.submitStopMarketOrder(order, portfolio.portfolio).subscribe();
        }
        else {
          this.modal.openCommandModal({
            ...order,
            type: CommandType.Stop,
            stopEndUnixTime: undefined
          });
        }
      });
  }

  getCurrentPositions(instrumentKey: InstrumentKey): Observable<Position | null> {
    return this.getCurrentPositionsWithPortfolio(instrumentKey)
      .pipe(
        map(({ position }) => position)
      );
  }

  private getCurrentPortfolio(): Observable<PortfolioKey> {
    return this.currentDashboardService.selectedPortfolio$
      .pipe(
        take(1)
      );
  }

  private getPositionsByPortfolio(instrumentKey: InstrumentKey, portfolio: PortfolioKey): Observable<Position | null> {
    return this.positionsService.getAllByPortfolio(portfolio.portfolio, portfolio.exchange).pipe(
      filter((positions): positions is Position[] => !!positions),
      map(positions => positions.find(pos => pos.symbol === instrumentKey.symbol) ?? null),
      take(1)
    );
  }

  private getCurrentPositionsWithPortfolio(instrumentKey: InstrumentKey): Observable<{ portfolio: PortfolioKey, position: Position | null }> {
    return this.getCurrentPortfolio().pipe(
      mapWith(
        portfolio => this.getPositionsByPortfolio(instrumentKey, portfolio),
        (portfolio, position) => ({ portfolio, position })
      ),
      take(1)
    );
  }
}
