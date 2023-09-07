import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { BottomMenuCmp } from "./bottomMenuCmp/bottomMenu.component";
import { ATPSelectorModule } from "src/atlasComponents/sapiViews/core/rich/ATPSelector";
import { SmartChipModule } from "src/components/smartChip";
import { SapiViewsCoreRegionModule } from "src/atlasComponents/sapiViews/core/region";
import { MatButtonModule } from "@angular/material/button";
import { MatRippleModule } from "@angular/material/core";

@NgModule({
  imports: [
    CommonModule,
    ATPSelectorModule,
    SmartChipModule,
    SapiViewsCoreRegionModule,
    MatButtonModule,
    MatRippleModule,
  ],
  declarations: [
    BottomMenuCmp,
  ],
  exports: [
    BottomMenuCmp,
  ]
})
export class BottomMenuModule{}
