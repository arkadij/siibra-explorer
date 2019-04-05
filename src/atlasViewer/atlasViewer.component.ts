import { Component, HostBinding, ViewChild, ViewContainerRef, OnDestroy, OnInit, TemplateRef, Injector } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, isDefined, FETCHED_SPATIAL_DATA, UPDATE_SPATIAL_DATA, TOGGLE_SIDE_PANEL, safeFilter } from "../services/stateStore.service";
import { Observable, Subscription, combineLatest } from "rxjs";
import { map, filter, distinctUntilChanged, delay, concatMap, debounceTime } from "rxjs/operators";
import { AtlasViewerDataService } from "./atlasViewer.dataService.service";
import { WidgetServices } from "./widgetUnit/widgetService.service";
import { LayoutMainSide } from "../layouts/mainside/mainside.component";
import { AtlasViewerConstantsServices } from "./atlasViewer.constantService.service";
import { BsModalService } from "ngx-bootstrap/modal";
import { ModalUnit } from "./modalUnit/modalUnit.component";
import { AtlasViewerURLService } from "./atlasViewer.urlService.service";
import { AtlasViewerAPIServices } from "./atlasViewer.apiService.service";

import '../res/css/extra_styles.css'
import { NehubaContainer } from "../ui/nehubaContainer/nehubaContainer.component";
import { colorAnimation } from "./atlasViewer.animation"
import { FixedMouseContextualContainerDirective } from "src/util/directives/FixedMouseContextualContainerDirective.directive";
import { DatabrowserService } from "src/ui/databrowserModule/databrowser.service";

@Component({
  selector: 'atlas-viewer',
  templateUrl: './atlasViewer.template.html',
  styleUrls: [
    `./atlasViewer.style.css`
  ],
  animations : [
    colorAnimation
  ]
})

export class AtlasViewer implements OnDestroy, OnInit {

  @ViewChild('floatingMouseContextualContainer', { read: ViewContainerRef }) floatingMouseContextualContainer: ViewContainerRef
  @ViewChild('helpComponent', {read: TemplateRef}) helpComponent : TemplateRef<any>
  @ViewChild('viewerConfigComponent', {read: TemplateRef}) viewerConfigComponent : TemplateRef<any>
  @ViewChild('signinModalComponent', {read: TemplateRef}) signinModalComponent : TemplateRef<any>
  @ViewChild(LayoutMainSide) layoutMainSide: LayoutMainSide

  @ViewChild(NehubaContainer) nehubaContainer: NehubaContainer

  @ViewChild(FixedMouseContextualContainerDirective) rClContextualMenu: FixedMouseContextualContainerDirective
  /**
   * required for styling of all child components
   */
  @HostBinding('attr.darktheme')
  darktheme: boolean = false

  meetsRequirement: boolean = true

  public sidePanelView$: Observable<string|null>
  private newViewer$: Observable<any>

  public selectedRegions$: Observable<any[]>
  public selectedPOI$ : Observable<any[]>
  private showHelp$: Observable<any>
  private showConfig$: Observable<any>

  public dedicatedView$: Observable<string | null>
  public onhoverSegment$: Observable<string>
  public onhoverSegmentForFixed$: Observable<string>
  public onhoverLandmark$ : Observable<string | null>
  private subscriptions: Subscription[] = []

  /* handlers for nglayer */
  /**
   * TODO make untangle nglayernames and its dependency on ng
   */
  public ngLayerNames$ : Observable<any>
  public ngLayers : NgLayerInterface[]
  private disposeHandler : any

  get toggleMessage(){
    return this.constantsService.toggleMessage
  }

  constructor(
    private store: Store<ViewerStateInterface>,
    public dataService: AtlasViewerDataService,
    private widgetServices: WidgetServices,
    private constantsService: AtlasViewerConstantsServices,
    public urlService: AtlasViewerURLService,
    public apiService: AtlasViewerAPIServices,
    private modalService: BsModalService,
    private databrowserService: DatabrowserService,
    private injector: Injector
  ) {
    this.ngLayerNames$ = this.store.pipe(
      select('viewerState'),
      filter(state => isDefined(state) && isDefined(state.templateSelected)),
      distinctUntilChanged((o,n) => o.templateSelected.name === n.templateSelected.name),
      map(state => Object.keys(state.templateSelected.nehubaConfig.dataset.initialNgState.layers)),
      delay(0)
    )

    this.sidePanelView$ = this.store.pipe(
      select('uiState'),  
      filter(state => isDefined(state)),
      map(state => state.focusedSidePanel)
    )

    this.showHelp$ = this.constantsService.showHelpSubject$.pipe(
      debounceTime(170)
    )

    this.showConfig$ = this.constantsService.showConfigSubject$.pipe(
      debounceTime(170)
    )

    this.selectedRegions$ = this.store.pipe(
      select('viewerState'),
      filter(state=>isDefined(state)&&isDefined(state.regionsSelected)),
      map(state=>state.regionsSelected),
      distinctUntilChanged()
    )

    this.selectedPOI$ = combineLatest(
      this.selectedRegions$,
      this.store.pipe(
        select('viewerState'),
        filter(state => isDefined(state) && isDefined(state.landmarksSelected)),
        map(state => state.landmarksSelected),
        distinctUntilChanged()
      )
    ).pipe(
      map(results => [...results[0], ...results[1]])
    )

    this.newViewer$ = this.store.pipe(
      select('viewerState'),
      filter(state => isDefined(state) && isDefined(state.templateSelected)),
      map(state => state.templateSelected),
      distinctUntilChanged((t1, t2) => t1.name === t2.name)
    )

    this.dedicatedView$ = this.store.pipe(
      select('viewerState'),
      filter(state => isDefined(state) && typeof state.dedicatedView !== 'undefined'),
      map(state => state.dedicatedView),
      distinctUntilChanged()
    )

    this.onhoverLandmark$ = combineLatest(
      this.store.pipe(
        select('uiState'),
        map(state => state.mouseOverLandmark)
      ),
      this.store.pipe(
        select('dataStore'),
        safeFilter('fetchedSpatialData'),
        map(state=>state.fetchedSpatialData)
      )
    ).pipe(
      map(([landmark, spatialDatas]) => {
        if(landmark === null)
          return landmark
        const idx = Number(landmark.replace('label=',''))
        if(isNaN(idx))
          return `Landmark index could not be parsed as a number: ${landmark}`
        return spatialDatas[idx].name
      })
    )

    // TODO temporary hack. even though the front octant is hidden, it seems if a mesh is present, hover will select the said mesh
    this.onhoverSegment$ = combineLatest(
      this.store.pipe(
        select('uiState'),
        /* cannot filter by state, as the template expects a default value, or it will throw ExpressionChangedAfterItHasBeenCheckedError */
        map(state => state
            && state.mouseOverSegment
            && (isNaN(state.mouseOverSegment)
              ? state.mouseOverSegment
              : state.mouseOverSegment.toString())),
        distinctUntilChanged((o, n) => o === n || (o && n && o.name && n.name && o.name === n.name))
      ),
      this.onhoverLandmark$
    ).pipe(
      map(([segment, onhoverLandmark]) => onhoverLandmark ? null : segment )
    )

    this.onhoverSegmentForFixed$ = this.onhoverSegment$.pipe(
      filter(() => !this.rClContextualMenu || !this.rClContextualMenu.isShown )
    )


    this.selectedParcellation$ = this.store.pipe(
      select('viewerState'),
      safeFilter('parcellationSelected'),
      map(state=>state.parcellationSelected),
      distinctUntilChanged(),
    )

    this.subscriptions.push(
      this.selectedParcellation$.subscribe(parcellation => this.selectedParcellation = parcellation)
    )

    this.subscriptions.push(
      this.newViewer$.subscribe(template => this.selectedTemplate = template)
    )
  }

  private selectedParcellation$: Observable<any>
  private selectedParcellation: any

  ngOnInit() {
    this.meetsRequirement = this.meetsRequirements()

    this.subscriptions.push(
      this.showHelp$.subscribe(() => 
        this.modalService.show(ModalUnit, {
          initialState: {
            title: this.constantsService.showHelpTitle,
            template: this.helpComponent
          }
        })
      )
    )

    this.subscriptions.push(
      this.constantsService.showSigninSubject$.pipe(
        debounceTime(160)
      ).subscribe(user => {
        this.modalService.show(ModalUnit, {
          initialState: {
            title: user ? 'Logout' : `Login`,
            template: this.signinModalComponent
          }
        })
      })
    )

    this.subscriptions.push(
      this.showConfig$.subscribe(() => {
        this.modalService.show(ModalUnit, {
          initialState: {
            title: this.constantsService.showConfigTitle,
            template: this.viewerConfigComponent
          }
        })
      })
    )

    this.subscriptions.push(
      this.ngLayerNames$.pipe(
        concatMap(data => this.constantsService.loadExportNehubaPromise.then(data))
      ).subscribe(() => {
        this.ngLayersChangeHandler()
        this.disposeHandler = window['viewer'].layerManager.layersChanged.add(() => this.ngLayersChangeHandler())
        window['viewer'].registerDisposer(this.disposeHandler)
      })
    )

    this.subscriptions.push(
      this.newViewer$.subscribe(template => {
        this.darktheme = this.meetsRequirement ?
          template.useTheme === 'dark' :
          false

        this.constantsService.darktheme = this.darktheme
        
        /* new viewer should reset the spatial data search */
        this.store.dispatch({
          type : FETCHED_SPATIAL_DATA,
          fetchedDataEntries : []
        })
        this.store.dispatch({
          type : UPDATE_SPATIAL_DATA,
          totalResults : 0
        })

        this.widgetServices.clearAllWidgets()
      })
    )

    this.subscriptions.push(
      this.sidePanelView$.pipe(
        filter(() => typeof this.layoutMainSide !== 'undefined')
      ).subscribe(v => this.layoutMainSide.showSide =  isDefined(v))
    )

  }

  /**
   * For completeness sake. Root element should never be destroyed. 
   */
  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  /**
   * perhaps move this to constructor?
   */
  meetsRequirements() {

    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') as WebGLRenderingContext

    if (!gl) {
      return false
    }

    const colorBufferFloat = gl.getExtension('EXT_color_buffer_float')
    
    if (!colorBufferFloat) {
      return false
    }

    if(this.constantsService.mobile){
      this.modalService.show(ModalUnit,{
        initialState: {
          title: this.constantsService.mobileWarningHeader,
          body: this.constantsService.mobileWarning
        }
      })
    }
    return true
  }

  ngLayersChangeHandler(){
    this.ngLayers = (window['viewer'].layerManager.managedLayers as any[])
      // .filter(obj => obj.sourceUrl && /precomputed|nifti/.test(obj.sourceUrl))
      .map(obj => ({
        name : obj.name,
        type : obj.initialSpecification.type,
        source : obj.sourceUrl,
        visible : obj.visible
      }) as NgLayerInterface)
  }

  panelAnimationEnd(){

    if( this.nehubaContainer && this.nehubaContainer.nehubaViewer && this.nehubaContainer.nehubaViewer.nehubaViewer )
      this.nehubaContainer.nehubaViewer.nehubaViewer.redraw()
  }

  nehubaClickHandler(event:MouseEvent){
    if (!this.rClContextualMenu) return
    this.rClContextualMenu.mousePos = [
      event.clientX,
      event.clientY
    ]
    this.rClContextualMenu.show()
  }

  toggleSidePanel(panelName:string){
    this.store.dispatch({
      type : TOGGLE_SIDE_PANEL,
      focusedSidePanel :panelName
    })
  }

  private selectedTemplate: any
  searchRegion(regions:any[]){
    this.rClContextualMenu.hide()
    this.databrowserService.createDatabrowser({ regions, parcellation: this.selectedParcellation, template: this.selectedTemplate })
  }

  @HostBinding('attr.version')
  public _version : string = VERSION

  get isMobile(){
    return this.constantsService.mobile
  }
}

export interface NgLayerInterface{
  name : string
  visible : boolean
  source : string
  type : string // image | segmentation | etc ...
  transform? : [[number, number, number, number],[number, number, number, number],[number, number, number, number],[number, number, number, number]] | null
  // colormap : string
}
