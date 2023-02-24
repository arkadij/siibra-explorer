import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SAPI } from 'src/atlasComponents/sapi/sapi.service';
import { Feature, TabularFeature } from 'src/atlasComponents/sapi/sxplrTypes';

function isTabularData(feature: unknown): feature is { data: TabularFeature<number|string|number[]> } {
  return feature['@type'].includes("siibra-0.4/feature/tabular")
}

@Component({
  selector: 'sxplr-feature-view',
  templateUrl: './feature-view.component.html',
  styleUrls: ['./feature-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureViewComponent implements OnChanges {

  @Input()
  feature: Feature

  busy$ = new BehaviorSubject<boolean>(false)

  tabular$: BehaviorSubject<TabularFeature<number|string|number[]>> = new BehaviorSubject(null)
  columns$: Observable<string[]> = this.tabular$.pipe(
    map(data => data
      ? ['index', ...data.columns]
      : []),
  )
  constructor(private sapi: SAPI) { }

  ngOnChanges(): void {
    console.log(this.feature)
    this.tabular$.next(null)
    this.busy$.next(true)
    this.sapi.v3Get("/feature/{feature_id}", {
      path: {
        feature_id: this.feature.id
      }
    }).subscribe(
      val => {
        this.busy$.next(false)

        if (!isTabularData(val)) return
        this.tabular$.next(val.data)
      },
      () => this.busy$.next(false)
    )
  }
}
