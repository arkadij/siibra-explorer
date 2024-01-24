import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, combineLatest, concat, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, shareReplay, switchMap, withLatestFrom } from 'rxjs/operators';
import { SAPI } from 'src/atlasComponents/sapi/sapi.service';
import { Feature, VoiFeature } from 'src/atlasComponents/sapi/sxplrTypes';
import { DARKTHEME } from 'src/util/injectionTokens';
import { isVoiData, notQuiteRight } from "../guards"
import { Action, Store, select } from '@ngrx/store';
import { atlasSelection } from 'src/state';

@Component({
  selector: 'sxplr-feature-view',
  templateUrl: './feature-view.component.html',
  styleUrls: ['./feature-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureViewComponent {

  #feature$ = new BehaviorSubject<Feature>(null)
  @Input()
  set feature(val: Feature) {
    this.#feature$.next(val)
  }

  #featureId = this.#feature$.pipe(
    map(f => f.id)
  )

  #featureDetail$ = this.#feature$.pipe(
    switchMap(f => this.sapi.getV3FeatureDetailWithId(f.id)),
    shareReplay(1),
  )

  
  #featureDesc$ = this.#feature$.pipe(
    switchMap(() => concat(
      of(null as string),
      this.#featureDetail$.pipe(
        map(v => v.desc)
      )
    ))
  )

  #voi$ = this.#feature$.pipe(
    switchMap(() => concat(
      of(null as VoiFeature),
      this.#featureDetail$.pipe(
        map(val => {
          if (isVoiData(val)) {
            return val
          }
          return null as VoiFeature
        })
      )
    ))
  )

  #warnings$ = this.#feature$.pipe(
    switchMap(() => concat(
      of([] as string[]),
      this.#featureDetail$.pipe(
        map(notQuiteRight)
      )
    ))
  )
  #isConnectivity$ = this.#feature$.pipe(
    map(v => v.category === "connectivity")
  )

  #selectedRegion$ = this.store.pipe(
    select(atlasSelection.selectors.selectedRegions)
  )

  #additionalParams$: Observable<Record<string, string>> = this.#isConnectivity$.pipe(
    withLatestFrom(this.#selectedRegion$),
    map(([ isConnnectivity, selectedRegions ]) => isConnnectivity
    ? {"regions": selectedRegions.map(r => r.name).join(" ")}
    : {} )
  )

  #plotlyInput$ = combineLatest([
    this.#featureId,
    this.darktheme$,
    this.#additionalParams$,
  ]).pipe(
    debounceTime(16),
    map(([ id, darktheme, additionalParams ]) => ({ id, darktheme, additionalParams })),
    distinctUntilChanged((o, n) => o.id === n.id && o.darktheme === n.darktheme),
    shareReplay(1),
  )

  #loadingDetail$ = this.#feature$.pipe(
    switchMap(() => concat(
      of(true),
      this.#featureDetail$.pipe(
        map(() => false)
      )
    ))
  )
  
  #loadingPlotly$ = this.#plotlyInput$.pipe(
    switchMap(() => concat(
      of(true),
      this.plotly$.pipe(
        map(() => false)
      )
    )),
  )

  plotly$ = this.#plotlyInput$.pipe(
    switchMap(({ id, darktheme, additionalParams }) => {
      if (!id) {
        return of(null)
      }
      return this.sapi.getFeaturePlot(
        id,
        {
          template: darktheme ? 'plotly_dark' : 'plotly_white',
          ...additionalParams
        }
      ).pipe(
        catchError(() => of(null))
      )
    }),
    shareReplay(1),
  )
  
  #detailLinks = this.#feature$.pipe(
    switchMap(() => concat(
      of([] as string[]),
      this.#featureDetail$.pipe(
        map(val => (val.link || []).map(l => l.href))
      )
    ))
  )

  additionalLinks$ = this.#detailLinks.pipe(
    distinctUntilChanged((o, n) => o.length == n.length),
    withLatestFrom(this.#feature$),
    map(([links, feature]) => {
      const set = new Set((feature.link || []).map(v => v.href))
      return links.filter(l => !set.has(l))
    })
  )

  downloadLink$ = this.sapi.sapiEndpoint$.pipe(
    switchMap(endpoint => this.#featureId.pipe(
      map(featureId => `${endpoint}/feature/${featureId}/download`),
      shareReplay(1)
    ))
  )

  intents$ = this.#isConnectivity$.pipe(
    withLatestFrom(this.#featureId, this.#selectedRegion$),
    switchMap(([flag, fid, selectedRegion]) => {
      if (!flag) {
        return EMPTY
      }
      return this.sapi.getFeatureIntents(fid, {
        region: selectedRegion.map(r => r.name).join(" ")
      }).pipe(
        switchMap(val => 
          this.sapi.iteratePages(
            val,
            page => this.sapi.getFeatureIntents(fid, {
              region: selectedRegion.map(r => r.name).join(" "),
              page: page.toString()
            }
          )
        ))
      )
    })
  )

  constructor(
    private sapi: SAPI,
    private store: Store,
    @Inject(DARKTHEME) public darktheme$: Observable<boolean>,  
  ) {
  }

  navigateToRegionByName(regionName: string){
    this.store.dispatch(
      atlasSelection.actions.navigateToRegion({
        region: {
          name: regionName
        }
      })
    )
  }

  onAction(action: Action){
    this.store.dispatch(action)
  }
  
  specialView$ = combineLatest([
    this.#voi$,
    this.plotly$
  ]).pipe(
    map(([ voi, plotly ]) => {
      return {
        voi, plotly
      }
    })
  )

  baseView$ = combineLatest([
    this.#feature$,
    combineLatest([
      this.#loadingDetail$,
      this.#loadingPlotly$
    ]).pipe(
      map(flags => flags.some(f => f))
    ),
    this.#warnings$,
    this.additionalLinks$,
    this.downloadLink$,
    this.#featureDesc$
  ]).pipe(
    map(([ feature, busy, warnings, additionalLinks, downloadLink, desc ]) => {
      return {
        name: feature.name,
        links: feature.link,
        category: feature.category === 'Unknown category'
        ? `Other feature`
        : `${feature.category} feature`,
        busy,
        warnings,
        additionalLinks,
        downloadLink,
        desc
      }
    })
  )

  view$ = combineLatest([
    this.baseView$,
    this.specialView$
  ]).pipe(
    map(([obj1, obj2]) => {
      return {
        ...obj1,
        ...obj2,
      }
    })
  )
}
