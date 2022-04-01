import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';
import { selectNewInstrument } from 'src/app/shared/ngrx/actions/sync.actions';
import { WatchedInstrument } from '../../models/watched-instrument.model';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';

@Component({
  selector: 'ats-watchlist-table',
  templateUrl: './watchlist-table.component.html',
  styleUrls: ['./watchlist-table.component.less']
})
export class WatchlistTableComponent implements OnInit {

  watchedInstruments$: Observable<WatchedInstrument[]> = of([])

  constructor(private store: Store, private service: WatchInstrumentsService) { }

  ngOnInit(): void {
    this.watchedInstruments$ = this.service.getWatched();
  }

  makeActive(instrument: Instrument) {
    this.store.dispatch(selectNewInstrument({ instrument }))
  }

  remove(instr: Instrument) {
    this.service.remove(instr);
  }
}
