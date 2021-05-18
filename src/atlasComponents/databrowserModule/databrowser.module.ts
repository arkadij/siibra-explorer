import { CommonModule } from "@angular/common";
import { NgModule, CUSTOM_ELEMENTS_SCHEMA, Optional } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ComponentsModule } from "src/components/components.module";
import { AngularMaterialModule } from 'src/ui/sharedModules/angularMaterial.module'
import { UtilModule } from "src/util";
import { DataBrowser } from "./databrowser/databrowser.component";
import { KgSingleDatasetService } from "./kgSingleDatasetService.service"
import { SingleDatasetView } from './singleDataset/detailedView/singleDataset.component'
import { AggregateArrayIntoRootPipe } from "./util/aggregateArrayIntoRoot.pipe";
import { CopyPropertyPipe } from "./util/copyProperty.pipe";
import { DatasetIsFavedPipe } from "./util/datasetIsFaved.pipe";
import { FilterDataEntriesbyMethods } from "./util/filterDataEntriesByMethods.pipe";
import { FilterDataEntriesByRegion } from "./util/filterDataEntriesByRegion.pipe";
import { PathToNestedChildren } from "./util/pathToNestedChildren.pipe";
import { RegionBackgroundToRgbPipe } from "./util/regionBackgroundToRgb.pipe";

import { ScrollingModule } from "@angular/cdk/scrolling";
import { PreviewFileIconPipe } from "./preview/previewFileIcon.pipe";
import { PreviewFileTypePipe } from "./preview/previewFileType.pipe";
import { SingleDatasetListView } from "./singleDataset/listView/singleDatasetListView.component";
import { GetKgSchemaIdFromFullIdPipe, getKgSchemaIdFromFullId } from "./util/getKgSchemaIdFromFullId.pipe";
import { PreviewFileVisibleInSelectedReferenceTemplatePipe } from "./util/previewFileDisabledByReferenceSpace.pipe";
import { DatasetPreviewList, UnavailableTooltip } from "./preview/datasetPreviews/datasetPreviewsList/datasetPreviewList.component";
import { PreviewComponentWrapper } from "./preview/previewComponentWrapper/previewCW.component";
import { BulkDownloadBtn, TransformDatasetToIdPipe } from "./bulkDownload/bulkDownloadBtn.component";
import { PreviewDatasetFile, IAV_DATASET_PREVIEW_DATASET_FN, IAV_DATASET_PREVIEW_ACTIVE, TypePreviewDispalyed } from "./preview/previewDatasetFile.directive";

import {
  DatasetPreview
} from 'src/services/state/dataStore.store'

import {
  OVERRIDE_IAV_DATASET_PREVIEW_DATASET_FN,
} from './constants'
import { ShownPreviewsDirective } from "./preview/shownPreviews.directive";
import { FilterPreviewByType } from "./preview/filterPreview.pipe";
import { PreviewCardComponent } from "./preview/previewCard/previewCard.component";
import { LayerBrowserModule } from "../../ui/layerbrowser";
import { DatabrowserDirective } from "./databrowser/databrowser.directive";
import { ContributorModule } from "./contributor";
import { DatabrowserService } from "./databrowser.service";
import { ShownDatasetDirective } from "./shownDataset.directive";
import { SingleDatasetSideNavView } from "./singleDataset/sideNavView/sDsSideNavView.component";
import { RegionalFeaturesModule } from "../regionalFeatures";
import { SingleDatasetDirective } from "./singleDataset/singleDataset.directive";
import { KgDatasetModule } from "../regionalFeatures/bsFeatures/kgDataset";


const previewEmitFactory = ( overrideFn: (file: any, dataset: any) => void) => {
  if (overrideFn) return overrideFn
  return () => console.error(`previewEmitFactory not overriden`)
}

@NgModule({
  imports: [
    CommonModule,
    ComponentsModule,
    ScrollingModule,
    FormsModule,
    UtilModule,
    AngularMaterialModule,
    LayerBrowserModule,
    ContributorModule,
    RegionalFeaturesModule,
    KgDatasetModule,
  ],
  declarations: [
    DataBrowser,
    SingleDatasetView,
    SingleDatasetDirective,
    SingleDatasetListView,
    DatasetPreviewList,
    PreviewComponentWrapper,
    BulkDownloadBtn,
    PreviewCardComponent,
    SingleDatasetSideNavView,

    /**
     * Directives
     */
    PreviewDatasetFile,
    ShownPreviewsDirective,
    DatabrowserDirective,
    ShownDatasetDirective,

    /**
     * pipes
     */
    PathToNestedChildren,
    CopyPropertyPipe,
    FilterDataEntriesbyMethods,
    FilterDataEntriesByRegion,
    AggregateArrayIntoRootPipe,
    DatasetIsFavedPipe,
    RegionBackgroundToRgbPipe,
    GetKgSchemaIdFromFullIdPipe,
    PreviewFileIconPipe,
    PreviewFileTypePipe,
    PreviewFileVisibleInSelectedReferenceTemplatePipe,
    UnavailableTooltip,
    TransformDatasetToIdPipe,
    PreviewFileTypePipe,
    FilterPreviewByType,
  ],
  exports: [
    KgDatasetModule,
    DataBrowser,
    SingleDatasetView,
    SingleDatasetDirective,
    SingleDatasetListView,
    FilterDataEntriesbyMethods,
    GetKgSchemaIdFromFullIdPipe,
    BulkDownloadBtn,
    TransformDatasetToIdPipe,
    PreviewDatasetFile,
    PreviewFileTypePipe,
    ShownPreviewsDirective,
    FilterPreviewByType,
    PreviewCardComponent,
    DatabrowserDirective,
    ShownDatasetDirective,
    SingleDatasetSideNavView,
  ],
  entryComponents: [
    DataBrowser,
    SingleDatasetView,
    PreviewComponentWrapper
  ],
  providers: [
    KgSingleDatasetService,
    DatabrowserService,
    {
      provide: IAV_DATASET_PREVIEW_DATASET_FN,
      useFactory: previewEmitFactory,
      deps: [ [new Optional(), OVERRIDE_IAV_DATASET_PREVIEW_DATASET_FN] ]
    }
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
  /**
   * shouldn't need bootstrap, so no need for browser module
   */
})

export class DatabrowserModule {
}

export { DatasetPreview, IAV_DATASET_PREVIEW_ACTIVE, TypePreviewDispalyed }

export { getKgSchemaIdFromFullId }
