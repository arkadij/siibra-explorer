import { ChangeDetectorRef, EventEmitter, Input, OnInit, Output, TemplateRef } from "@angular/core";
import { Observable } from "rxjs";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { IDataEntry, IFile, IPublication, ViewerPreviewFile } from 'src/services/state/dataStore.store'
import { HumanReadableFileSizePipe } from "src/util/pipes/humanReadableFileSize.pipe";
import { DatabrowserService } from "../databrowser.service";
import { KgSingleDatasetService } from "../kgSingleDatasetService.service";

export {
  DatabrowserService,
  KgSingleDatasetService,
  ChangeDetectorRef,
  AtlasViewerConstantsServices,
}

export class SingleDatasetBase implements OnInit {

  @Input() public ripple: boolean = false

  /**
   * the name/desc/publications are placeholder/fallback entries
   * while the actual data is being loaded from KG with kgSchema and kgId
   */
  @Input() public name?: string
  @Input() public title?: string
  @Input() public description?: string
  @Input() public publications?: IPublication[]

  @Input() public kgSchema?: string
  @Input() public kgId?: string

  @Input() public dataset: any = null
  @Input() public simpleMode: boolean = false

  @Input() public kgExternalLink: string = ''
  @Input() public underEmbargo: boolean = false

  @Output() public previewingFile: EventEmitter<ViewerPreviewFile> = new EventEmitter()

  public preview: boolean = false
  private humanReadableFileSizePipe: HumanReadableFileSizePipe = new HumanReadableFileSizePipe()

  /**
   * sic!
   */
  public kgReference: string[] = []
  public files: IFile[] = []
  private methods: string[] = []
  /**
   * sic!
   */
  private parcellationRegion: Array<{ name: string }>

  private error: string = null

  public fetchingSingleInfoInProgress = false
  public downloadInProgress = false

  public dlFromKgHref: string = null

  public favedDataentries$: Observable<IDataEntry[]>
  constructor(
    private dbService: DatabrowserService,
    private singleDatasetService: KgSingleDatasetService,
    private cdr: ChangeDetectorRef,
    private constantService: AtlasViewerConstantsServices,

    dataset?: any,
  ) {
    this.favedDataentries$ = this.dbService.favedDataentries$
    if (dataset) {
      this.dataset = dataset
      const { fullId } = dataset
      const obj = this.singleDatasetService.getKgSchemaKgIdFromFullId(fullId)
      if (obj) {
        const { kgSchema, kgId } = obj
        this.kgSchema = kgSchema
        this.kgId = kgId
      }
    }
  }

  public ngOnInit() {
    const { kgId, kgSchema, dataset } = this
    this.dlFromKgHref = this.singleDatasetService.getDownloadZipFromKgHref({ kgSchema, kgId })
    if ( dataset ) {
      const { name, title, description, kgReference, publications, files, preview, kgExternalLink, underEmbargo } = dataset
      this.name = name
      this.title = title
      this.description = description
      this.kgReference = kgReference
      this.publications = publications
      this.files = files
      this.preview = preview
      this.kgExternalLink = kgExternalLink
      this.underEmbargo = underEmbargo

      return
    }
    if (!kgSchema || !kgId) { return }
    this.fetchingSingleInfoInProgress = true
    this.singleDatasetService.getInfoFromKg({
      kgId,
      kgSchema,
    })
      .then(json => {
        /**
         * TODO dataset specific
         */
        const { files, publications, name, description, kgReference} = json
        this.name = name
        this.description = description
        this.kgReference = kgReference
        this.publications = publications
        this.files = files

        this.dataset = json

        this.cdr.markForCheck()
      })
      .catch(e => {
        this.error = e
      })
      .finally(() => {
        this.fetchingSingleInfoInProgress = false
        this.cdr.markForCheck()
      })
  }

  get downloadEnabled() {
    return this.kgSchema && this.kgId
  }

  get numOfFiles() {
    return this.files
      ? this.files.length
      : null
  }

  get totalFileByteSize() {
    return this.files
      ? this.files.reduce((acc, curr) => acc + curr.byteSize, 0)
      : null
  }

  get tooltipText() {
    return `${this.numOfFiles} files ~ ${this.humanReadableFileSizePipe.transform(this.totalFileByteSize)}`
  }

  get showFooter() {
    return (this.kgReference && this.kgReference.length > 0)
      || (this.publications && this.publications.length > 0)
      || (this.files && this.files.length > 0)
  }

  public toggleFav() {
    this.dbService.toggleFav(this.dataset)
  }

  public showPreviewList(templateRef: TemplateRef<any>) {
    this.singleDatasetService.showPreviewList(templateRef)
  }

  public handlePreviewFile(file: ViewerPreviewFile) {
    this.previewingFile.emit(file)
    this.singleDatasetService.previewFile(file, this.dataset)
  }
}
