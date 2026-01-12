import { defineStore } from 'pinia'
import type {
  Study,
  ClinicalAttribute,
  Patient,
  MolecularProfile,
  SampleList,
  ClinicalDataItem,
} from '~/types/cbioportal'

interface StudyState {
  // Studies list (cached)
  studies: Study[]
  studiesLoaded: boolean

  // Current study data
  currentStudy: Study | null
  currentStudyId: string | null
  clinicalAttributes: ClinicalAttribute[]
  patients: Patient[]
  sampleData: ClinicalDataItem[]
  molecularProfiles: MolecularProfile[]
  sampleLists: SampleList[]

  // Loading states
  isLoadingStudies: boolean
  isLoadingStudyData: boolean
  error: string | null
}

export const useStudyStore = defineStore('study', {
  state: (): StudyState => ({
    studies: [],
    studiesLoaded: false,
    currentStudy: null,
    currentStudyId: null,
    clinicalAttributes: [],
    patients: [],
    sampleData: [],
    molecularProfiles: [],
    sampleLists: [],
    isLoadingStudies: false,
    isLoadingStudyData: false,
    error: null,
  }),

  getters: {
    // Get TCGA PanCancer Atlas studies
    tcgaPanCanStudies: (state): Study[] => {
      return state.studies.filter((s) => s.studyId.includes('pan_can_atlas'))
    },

    // Get all TCGA studies
    tcgaStudies: (state): Study[] => {
      return state.studies.filter((s) => s.studyId.includes('tcga'))
    },

    // Get other public studies
    otherStudies: (state): Study[] => {
      return state.studies.filter(
        (s) => !s.studyId.includes('tcga') && s.publicStudy
      )
    },

    // Patient count
    patientCount: (state): number => state.patients.length,

    // Sample count (from sample lists, more reliable than study.allSampleCount)
    sampleCount: (state): number => {
      const allSamplesList = state.sampleLists.find(
        (sl) => sl.category === 'all_cases_in_study' || sl.sampleListId.endsWith('_all')
      )
      if (allSamplesList && allSamplesList.sampleCount > 0) {
        return allSamplesList.sampleCount
      }
      // Fallback to study allSampleCount
      return state.currentStudy?.allSampleCount || 0
    },

    // Get patient attributes (filter from clinical attributes)
    patientAttributes: (state): ClinicalAttribute[] => {
      return state.clinicalAttributes.filter((a) => a.patientAttribute)
    },

    // Get sample attributes
    sampleAttributes: (state): ClinicalAttribute[] => {
      return state.clinicalAttributes.filter((a) => !a.patientAttribute)
    },

    // Check if survival data is available
    hasSurvivalData: (state): boolean => {
      return state.patients.some(
        (p) => p.OS_MONTHS !== undefined && p.OS_STATUS !== undefined
      )
    },

    // Get unique cancer types in current study
    cancerTypes: (state): string[] => {
      const types = new Set<string>()
      for (const p of state.patients) {
        if (p.CANCER_TYPE) types.add(String(p.CANCER_TYPE))
        if (p.CANCER_TYPE_DETAILED) types.add(String(p.CANCER_TYPE_DETAILED))
      }
      return Array.from(types)
    },
  },

  actions: {
    async loadStudies() {
      if (this.studiesLoaded) return

      this.isLoadingStudies = true
      this.error = null

      try {
        const { fetchStudies, filterAndSortStudies } = useCBioPortal()
        const studies = await fetchStudies()
        this.studies = filterAndSortStudies(studies)
        this.studiesLoaded = true
      } catch (e) {
        this.error = 'Failed to load studies'
        console.error(e)
      } finally {
        this.isLoadingStudies = false
      }
    },

    async loadStudyData(studyId: string) {
      // Skip if already loaded
      if (this.currentStudyId === studyId && this.currentStudy) {
        return
      }

      this.isLoadingStudyData = true
      this.error = null
      this.currentStudyId = studyId

      try {
        const { fetchStudyData } = useCBioPortal()
        const data = await fetchStudyData(studyId)

        if (data) {
          this.currentStudy = data.study
          this.clinicalAttributes = data.clinicalAttributes
          this.patients = data.patients
          this.sampleData = data.sampleData
          this.molecularProfiles = data.molecularProfiles
          this.sampleLists = data.sampleLists
        }
      } catch (e) {
        this.error = 'Failed to load study data'
        console.error(e)
      } finally {
        this.isLoadingStudyData = false
      }
    },

    clearCurrentStudy() {
      this.currentStudy = null
      this.currentStudyId = null
      this.clinicalAttributes = []
      this.patients = []
      this.sampleData = []
      this.molecularProfiles = []
      this.sampleLists = []
    },
  },
})
