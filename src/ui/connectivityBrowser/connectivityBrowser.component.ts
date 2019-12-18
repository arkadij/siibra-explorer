import {
    AfterViewInit, ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    ViewChild
} from "@angular/core";
import {AtlasViewerConstantsServices} from "src/atlasViewer/atlasViewer.constantService.service";
import {Observable, Subject, Subscription} from "rxjs";
import {select, Store} from "@ngrx/store";
import {HIDE_SIDE_PANEL_CONNECTIVITY, isDefined, safeFilter} from "src/services/stateStore.service";
import {distinctUntilChanged, filter, map} from "rxjs/operators";
import {CLEAR_CONNECTIVITY_REGION, SET_CONNECTIVITY_REGION} from "src/services/state/viewerState.store";

@Component({
    selector: 'connectivity-browser',
    templateUrl: './connectivityBrowser.template.html',
})
export class ConnectivityBrowserComponent implements AfterViewInit, OnDestroy {

    private region: string
    private connectedAreas = []


    private connectivityRegion$: Observable<any>
    private selectedParcellation$: Observable<any>
    private subscriptions: Subscription[] = []
    private selectedParcellation: any
    public collapseMenu = -1
    public allRegions = []
    public defaultColorMap: Map<string, Map<number, {red: number, green: number, blue: number}>>
    private noConnectivityForRegion = false

    math = Math

    @ViewChild('connectivityComponent', {read: ElementRef}) connectivityComponentElement: ElementRef

    constructor(private constantService: AtlasViewerConstantsServices, private store$: Store<any> , private changeDetectionRef : ChangeDetectorRef
    ){
        this.selectedParcellation$ = this.store$.pipe(
            select('viewerState'),
            filter(state=>isDefined(state)&&isDefined(state.parcellationSelected)),
            map(state=>state.parcellationSelected),
            distinctUntilChanged(),
        )

        this.connectivityRegion$ = this.store$.pipe(
            select('viewerState'),
            safeFilter('connectivityRegion'),
            map(state => state.connectivityRegion)
        )

    }

    ngAfterViewInit(): void {
        this.subscriptions.push(
            this.selectedParcellation$.subscribe(parcellation => {
                this.selectedParcellation = parcellation
                if (parcellation && parcellation.name && parcellation.name === 'JuBrain Cytoarchitectonic Atlas') {
                    this.noConnectivityForRegion = false
                    if (parcellation.regions && parcellation.regions.length) {
                        this.allRegions = []
                        this.getAllRegionsFromParcellation(parcellation.regions)
                        if (this.defaultColorMap) {
                            this.saveAndDisableExistingColorTemplate()
                        }
                    }
                } else {
                    this.noConnectivityForRegion = true
                }
            }),
            this.connectivityRegion$.subscribe(cr => {
                this.region = cr
                this.changeDetectionRef.detectChanges();
            })
        )

        this.connectivityComponentElement.nativeElement.addEventListener('connectivityDataReceived', e => {
            this.connectedAreas = e.detail
            if (this.connectedAreas.length > 0) this.saveAndDisableExistingColorTemplate()
        })

        this.connectivityComponentElement.nativeElement.addEventListener('collapsedMenuChanged', e => {
            this.collapseMenu = e.detail
        })
     }

     ngOnDestroy(): void {
        this.setDefaultMap()
        this.subscriptions.forEach(s => s.unsubscribe())
     }

     updateConnevtivityRegion(regionName) {
         this.store$.dispatch({
             type: SET_CONNECTIVITY_REGION,
             connectivityRegion: regionName
         })
     }

    public closeConnectivityView() {
        this.setDefaultMap()

        this.store$.dispatch({
            type: HIDE_SIDE_PANEL_CONNECTIVITY,
        })
        this.store$.dispatch({
            type: CLEAR_CONNECTIVITY_REGION
        })
    }

    setDefaultMap() {
        this.allRegions.forEach(r => {
            if (r && r.ngId && r.rgb) {
                this.defaultColorMap.get(r.ngId).set(r.labelIndex, {red: r.rgb[0], green: r.rgb[1], blue: r.rgb[2]})
            }
            getWindow().interactiveViewer.viewerHandle.applyLayersColourMap(this.defaultColorMap)
        })
    }

    saveAndDisableExistingColorTemplate() {


        const hemisphere = this.region.includes('left hemisphere')? ' - left hemisphere' : ' - right hemisphere'

        this.defaultColorMap = new Map(getWindow().interactiveViewer.viewerHandle.getLayersSegmentColourMap())

        const existingMap: Map<string, Map<number, {red: number, green: number, blue: number}>> = (getWindow().interactiveViewer.viewerHandle.getLayersSegmentColourMap())

        const map = new Map(existingMap)

        this.allRegions.forEach(r => {

            if (r.ngId) {
                map.get(r.ngId).set(r.labelIndex, {red: 255, green: 255, blue: 255})
            }
        })

        this.connectedAreas.forEach(area => {
            const areaAsRegion = this.allRegions
                .filter(r => r.name === area.name + hemisphere)
                .map(r => r)

            if (areaAsRegion && areaAsRegion.length && areaAsRegion[0].ngId)
                // @ts-ignore
                map.get(areaAsRegion[0].ngId).set(areaAsRegion[0].labelIndex, {red: area.color.r, green: area.color.g, blue: area.color.b})

            getWindow().interactiveViewer.viewerHandle.applyLayersColourMap(map)
        })
    }

    getAllRegionsFromParcellation = (regions) => {
        for (let i = 0; i<regions.length; i ++) {
            if (regions[i].children && regions[i].children.length) {
                this.getAllRegionsFromParcellation(regions[i].children)
            } else {
                this.allRegions.push(regions[i])
            }
        }
    }


}

function getWindow (): any {
    return window;
}