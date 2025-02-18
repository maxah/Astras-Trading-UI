import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {OptionBoardWidgetComponent} from './widgets/option-board-widget/option-board-widget.component';
import {OptionBoardComponent} from './components/option-board/option-board.component';
import {OptionBoardSettingsComponent} from './components/option-board-settings/option-board-settings.component';
import {SharedModule} from "../../shared/shared.module";
import {TranslocoModule} from "@ngneat/transloco";
import {NzSpinModule} from "ng-zorro-antd/spin";
import {AllOptionsComponent} from './components/all-options/all-options.component';
import {SelectedOptionsComponent} from './components/selected-options/selected-options.component';
import {OptionBoardService} from "./services/option-board.service";
import {NzResizeObserverModule} from "ng-zorro-antd/cdk/resize-observer";
import {OptionPreviewComponent} from "./components/option-preview/option-preview.component";
import {CdkDrag, CdkDropList} from "@angular/cdk/drag-drop";


@NgModule({
  declarations: [
    OptionBoardWidgetComponent,
    OptionBoardComponent,
    OptionBoardSettingsComponent,
    AllOptionsComponent,
    SelectedOptionsComponent,
    OptionPreviewComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    TranslocoModule,
    NzSpinModule,
    NzResizeObserverModule,
    CdkDrag,
    CdkDropList
  ],
  exports: [
    OptionBoardWidgetComponent
  ],
  providers: [
    OptionBoardService
  ]
})
export class OptionBoardModule {
}
