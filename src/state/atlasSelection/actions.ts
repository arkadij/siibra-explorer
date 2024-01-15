import { createAction, props } from "@ngrx/store";
import { SxplrAtlas, SxplrParcellation, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { BreadCrumb, nameSpace, ViewerMode, AtlasSelectionState } from "./const"
import { TFace, TSandsPoint } from "src/util/types";

/**
 * @deprecated Please use selectATPById
 */
export const selectAtlas = createAction(
  `${nameSpace} selectAtlas`,
  props<{
    atlas: SxplrAtlas
    requested?: {
      template?: SxplrTemplate
      parcellation?: SxplrParcellation
    }
  }>()
)

/**
 * setAtlasSelectionState is called as a final step to (potentially) set:
 * - selectedAtlas
 * - selectedTemplate
 * - selectedParcellation
 * 
 * It is up to the dispatcher to ensure that the selection makes sense.
 * If any field is unset, it will take the default value from the store.
 * It is **specifically** not setup to do **anymore** than atlas, template and parcellation
 * 
 * We may setup post hook for navigation adjustments/etc.
 * Probably easier is simply subscribe to store and react to selectedTemplate selector
 */
export const setAtlasSelectionState = createAction(
  `${nameSpace} setAtlasSelectionState`,
  props<Partial<AtlasSelectionState>>()
)

export const setSelectedParcellationAllRegions = createAction(
  `${nameSpace} setSelectedParcellationAllRegions`,
  props<{
    regions: SxplrRegion[]
  }>()
)

export const selectRegion = createAction(
  `${nameSpace} selectRegion`,
  props<{
    region: SxplrRegion
  }>()
)

export const toggleRegion = createAction(
  `${nameSpace} toggleRegion`,
  props<{
    region: SxplrRegion
  }>()
)

export const setSelectedRegions = createAction(
  `${nameSpace} setSelectedRegions`,
  props<{
    regions: SxplrRegion[]
  }>()
)

export const setStandAloneVolumes = createAction(
  `${nameSpace} setStandAloneVolumes`,
  props<{
    standAloneVolumes: string[]
  }>()
)

export const setNavigation = createAction(
  `${nameSpace} setNavigation`,
  props<{
    navigation: {
      position: number[]
      orientation: number[]
      zoom: number
      perspectiveOrientation: number[]
      perspectiveZoom: number
    }
  }>()
)

export const setViewerMode = createAction(
  `${nameSpace} setViewerMode`,
  props<{
    viewerMode: ViewerMode
  }>()
)

export const showBreadCrumb = createAction(
  `${nameSpace} showBreadCrumb`,
  props<{
    breadcrumb: BreadCrumb
  }>()
)

export const dismissBreadCrumb = createAction(
  `${nameSpace} dismissBreadCrumb`,
  props<{
    id: string
  }>()
)

export const clearSelectedRegions = createAction(
  `${nameSpace} clearSelectedRegions`
)

export const selectATPById = createAction(
  `${nameSpace} selectATPById`,
  props<{
    atlasId?: string
    templateId?: string
    parcellationId?: string
    regionId?: string

    config?: {
      autoSelect?: boolean
      messages?: {
        template?: string
        parcellation?: string
      }
    }
  }>()
)

export const clearStandAloneVolumes = createAction(
  `${nameSpace} clearStandAloneVolumes`
)

/**
 * n.b. position in nm!
 * TODO this action currently sucks.
 * it depends on nehuba being available
 * and if so, potentially ease move there
 * 
 * should be moved to nehuba/store/navigateTo instead
 */
export const navigateTo = createAction(
  `${nameSpace} navigateTo`,
  props<{
    navigation: Partial<{
      position: number[]
      orientation: number[]
      zoom: number
      perspectiveOrientation: number[]
      perspectiveZoom: number
    }>
    physical?: boolean
    animation?: boolean
  }>()
)

export const navigateToRegion = createAction(
  `${nameSpace} navigateToRegion`,
  props<{
    region: Pick<SxplrRegion, 'name'>
  }>()
)

export const clearViewerMode = createAction(
  `${nameSpace} clearViewerMode`,
)

export const toggleRegionSelectById = createAction(
  `${nameSpace} toggleRegionSelectById`,
  props<{
    id: string
  }>()
)

export const viewSelRegionInNewSpace = createAction(
  `${nameSpace} viewSelRegionInNewSpace`,
  props<{
    region: SxplrRegion
    template: SxplrTemplate
  }>()
)

export const selectPoint = createAction(
  `${nameSpace} selectPoint`,
  props<{
    point: TSandsPoint|TFace
  }>()
)

export const clearSelectedPoint = createAction(
  `${nameSpace} clearPoint`
)
