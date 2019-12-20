import { Component, Output, EventEmitter, OnDestroy, ViewChild, TemplateRef } from "@angular/core";
import { MatDialogRef, MatDialog, MatSnackBar } from "@angular/material";
import { NgLayerInterface } from "src/atlasViewer/atlasViewer.component";
import { LayerBrowser } from "../layerbrowser/layerbrowser.component";
import {Observable, Subscription} from "rxjs";
import { Store, select } from "@ngrx/store";
import { map, startWith, scan, filter, mapTo } from "rxjs/operators";
import { trackRegionBy } from '../viewerStateController/regionHierachy/regionHierarchy.component'
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import {
  CLOSE_SIDE_PANEL,
  COLLAPSE_SIDE_PANEL_CURRENT_VIEW,
  EXPAND_SIDE_PANEL_CURRENT_VIEW,
} from "src/services/state/uiState.store";
import { SELECT_REGIONS, IavRootStoreInterface } from "src/services/stateStore.service";

@Component({
  selector: 'search-side-nav',
  templateUrl: './searchSideNav.template.html',
  styleUrls:[
    './searchSideNav.style.css'
  ]
})

export class SearchSideNav implements OnDestroy {
  public availableDatasets: number = 0

  private subscriptions: Subscription[] = []
  private layerBrowserDialogRef: MatDialogRef<any>

  @Output() dismiss: EventEmitter<any> = new EventEmitter()

  @ViewChild('layerBrowserTmpl', {read: TemplateRef}) layerBrowserTmpl: TemplateRef<any>

  public autoOpenSideNavDataset$: Observable<any>

  public sidePanelExploreCurrentViewIsOpen$: Observable<any>
  public sidePanelCurrentViewContent: Observable<any>

  constructor(
    public dialog: MatDialog,
    private store$: Store<IavRootStoreInterface>,
    private snackBar: MatSnackBar,
    private constantService: AtlasViewerConstantsServices,
  ){
    this.autoOpenSideNavDataset$ = this.store$.pipe(
      select('viewerState'),
      select('regionsSelected'),
      map(arr => arr.length),
      startWith(0),
      scan((acc, curr) => [curr, ...acc], []),
      filter(([curr, prev]) => prev === 0 && curr > 0),
      mapTo(true)
    )

    this.sidePanelExploreCurrentViewIsOpen$ = this.store$.pipe(
        select('uiState'),
        select("sidePanelExploreCurrentViewIsOpen")
    )

    this.sidePanelCurrentViewContent = this.store$.pipe(
        select('uiState'),
        select("sidePanelCurrentViewContent")
    )
  }

  collapseSidePanelCurrentView() {
    this.store$.dispatch({
      type: COLLAPSE_SIDE_PANEL_CURRENT_VIEW,
    })
  }

  expandSidePanelCurrentView() {
    this.store$.dispatch({
      type: EXPAND_SIDE_PANEL_CURRENT_VIEW,
    })
  }



  ngOnDestroy(){
    while(this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }

  handleNonbaseLayerEvent(layers: NgLayerInterface[]){
    if (layers.length  === 0) {
      this.layerBrowserDialogRef && this.layerBrowserDialogRef.close()
      this.layerBrowserDialogRef = null
      return  
    }
    if (this.layerBrowserDialogRef) return

    this.store$.dispatch({
      type: CLOSE_SIDE_PANEL,
    })

    const dialogToOpen = this.layerBrowserTmpl || LayerBrowser
    this.layerBrowserDialogRef = this.dialog.open(dialogToOpen, {
      hasBackdrop: false,
      autoFocus: false,
      panelClass: [
        'layerBrowserContainer'
      ],
      position: {
        top: '0'
      },
      disableClose: true
    })

    this.layerBrowserDialogRef.afterClosed().subscribe(val => {
      if (val === 'user action') this.snackBar.open(this.constantService.dissmissUserLayerSnackbarMessage, 'Dismiss', {
        duration: 5000
      })
    })
  }

  public deselectAllRegions(){
    this.store$.dispatch({
      type: SELECT_REGIONS,
      selectRegions: []
    })
  }

  trackByFn = trackRegionBy
}