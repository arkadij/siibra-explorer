import { FeatureResponse } from "src/atlasComponents/sapi"
import { IUserLandmark } from 'src/atlasViewer/atlasViewer.apiService.service';
import { INgLayerInterface } from 'src/atlasViewer/atlasViewer.component';

export interface IViewerState {
  fetchedTemplates: any[]

  templateSelected: any | null
  parcellationSelected: any | null
  regionsSelected: any[]
  featureSelected: FeatureResponse

  viewerMode: string

  landmarksSelected: any[]
  userLandmarks: IUserLandmark[]

  navigation: any | null

  loadedNgLayers: INgLayerInterface[]
  connectivityRegion: string | null
  overwrittenColorMap: string | null

  standaloneVolumes: any[]
}


export const defaultViewerState: IViewerState = {

  landmarksSelected : [],
  fetchedTemplates : [],
  loadedNgLayers: [],
  regionsSelected: [],
  featureSelected: null,
  viewerMode: null,
  userLandmarks: [],
  navigation: null,
  parcellationSelected: null,
  templateSelected: null,
  connectivityRegion: '',
  overwrittenColorMap: null,
  standaloneVolumes: []
}
