import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { BaseColumnId } from "../../../shared/models/settings/table-settings.model";

export interface AllTradesSettings extends WidgetSettings, InstrumentKey {
  allTradesColumns: string[];
  highlightRowsBySide?: boolean;
}

export const allTradesWidgetColumns: BaseColumnId[] = [
  { id: 'qty', displayName: 'Кол-во', isDefault: true },
  { id: 'price', displayName: 'Цена', isDefault: true },
  { id: 'timestamp', displayName: 'Время', isDefault: true },
  { id: 'side', displayName: 'Сторона', isDefault: false },
  { id: 'oi', displayName: 'Откр. интерес', isDefault: false },
  { id: 'existing', displayName: 'Новое событие', isDefault: false },
];
