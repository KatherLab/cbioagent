import type {
  Study,
  ClinicalAttribute,
  ClinicalDataItem,
  MolecularProfile,
  SampleList,
  Patient,
  ChartData,
  SurvivalData,
  ApiInfo,
} from '~/types/cbioportal'

const API_BASE = 'https://www.cbioportal.org/api'

export function useCBioPortal() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Check API health
  async function checkApiHealth(): Promise<ApiInfo | null> {
    try {
      const response = await $fetch<ApiInfo>(`${API_BASE}/info`)
      return response
    } catch (e) {
      console.error('API health check failed:', e)
      return null
    }
  }

  // Fetch all studies
  async function fetchStudies(): Promise<Study[]> {
    isLoading.value = true
    error.value = null
    try {
      const studies = await $fetch<Study[]>(`${API_BASE}/studies`, {
        params: { pageSize: 10000 },
      })
      return studies
    } catch (e) {
      error.value = 'Failed to fetch studies'
      console.error(e)
      return []
    } finally {
      isLoading.value = false
    }
  }

  // Fetch single study details
  async function fetchStudy(studyId: string): Promise<Study | null> {
    try {
      const study = await $fetch<Study>(`${API_BASE}/studies/${studyId}`)
      return study
    } catch (e) {
      console.error('Failed to fetch study:', e)
      return null
    }
  }

  // Fetch clinical attributes for a study
  async function fetchClinicalAttributes(studyId: string): Promise<ClinicalAttribute[]> {
    try {
      const attributes = await $fetch<ClinicalAttribute[]>(
        `${API_BASE}/studies/${studyId}/clinical-attributes`
      )
      return attributes
    } catch (e) {
      console.error('Failed to fetch clinical attributes:', e)
      return []
    }
  }

  // Fetch patient clinical data
  async function fetchPatientClinicalData(studyId: string): Promise<ClinicalDataItem[]> {
    try {
      const data = await $fetch<ClinicalDataItem[]>(
        `${API_BASE}/studies/${studyId}/clinical-data`,
        {
          params: {
            clinicalDataType: 'PATIENT',
            pageSize: 100000,
          },
        }
      )
      return data
    } catch (e) {
      console.error('Failed to fetch patient clinical data:', e)
      return []
    }
  }

  // Fetch sample clinical data
  async function fetchSampleClinicalData(studyId: string): Promise<ClinicalDataItem[]> {
    try {
      const data = await $fetch<ClinicalDataItem[]>(
        `${API_BASE}/studies/${studyId}/clinical-data`,
        {
          params: {
            clinicalDataType: 'SAMPLE',
            pageSize: 100000,
          },
        }
      )
      return data
    } catch (e) {
      console.error('Failed to fetch sample clinical data:', e)
      return []
    }
  }

  // Fetch molecular profiles
  async function fetchMolecularProfiles(studyId: string): Promise<MolecularProfile[]> {
    try {
      const profiles = await $fetch<MolecularProfile[]>(
        `${API_BASE}/studies/${studyId}/molecular-profiles`
      )
      return profiles
    } catch (e) {
      console.error('Failed to fetch molecular profiles:', e)
      return []
    }
  }

  // Fetch sample lists
  async function fetchSampleLists(studyId: string): Promise<SampleList[]> {
    try {
      const lists = await $fetch<SampleList[]>(
        `${API_BASE}/studies/${studyId}/sample-lists`
      )
      return lists
    } catch (e) {
      console.error('Failed to fetch sample lists:', e)
      return []
    }
  }

  // Transform clinical data items into patient objects
  function transformToPatients(clinicalData: ClinicalDataItem[]): Patient[] {
    const patientMap = new Map<string, Patient>()

    for (const item of clinicalData) {
      if (!patientMap.has(item.patientId)) {
        patientMap.set(item.patientId, {
          patientId: item.patientId,
          studyId: item.studyId,
        })
      }
      const patient = patientMap.get(item.patientId)!
      patient[item.clinicalAttributeId] = item.value
    }

    return Array.from(patientMap.values())
  }

  // Calculate frequency distribution for a categorical attribute
  function calculateDistribution(
    patients: Patient[],
    attributeId: string
  ): ChartData {
    const counts = new Map<string, number>()

    for (const patient of patients) {
      const value = patient[attributeId]
      if (value !== undefined && value !== null && value !== '') {
        const key = String(value)
        counts.set(key, (counts.get(key) || 0) + 1)
      }
    }

    // Sort by count descending
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])

    return {
      labels: sorted.map(([label]) => label),
      values: sorted.map(([, count]) => count),
    }
  }

  // Calculate age histogram
  function calculateAgeHistogram(patients: Patient[]): ChartData {
    const bins = [
      { label: '<30', min: 0, max: 30 },
      { label: '30-39', min: 30, max: 40 },
      { label: '40-49', min: 40, max: 50 },
      { label: '50-59', min: 50, max: 60 },
      { label: '60-69', min: 60, max: 70 },
      { label: '70-79', min: 70, max: 80 },
      { label: '80+', min: 80, max: 200 },
    ]

    const counts = bins.map(() => 0)

    for (const patient of patients) {
      const age = Number(patient.AGE)
      if (!isNaN(age)) {
        for (let i = 0; i < bins.length; i++) {
          if (age >= bins[i].min && age < bins[i].max) {
            counts[i]++
            break
          }
        }
      }
    }

    return {
      labels: bins.map((b) => b.label),
      values: counts,
    }
  }

  // Extract survival data
  function extractSurvivalData(patients: Patient[]): SurvivalData[] {
    return patients
      .filter((p) => p.OS_MONTHS !== undefined && p.OS_STATUS !== undefined)
      .map((p) => ({
        patientId: p.patientId,
        months: Number(p.OS_MONTHS),
        status: String(p.OS_STATUS),
      }))
      .filter((s) => !isNaN(s.months))
      .sort((a, b) => a.months - b.months)
  }

  // Filter studies to prioritize TCGA PanCancer Atlas
  function filterAndSortStudies(studies: Study[]): Study[] {
    return studies
      .filter((s) => s.publicStudy)
      .sort((a, b) => {
        // Prioritize TCGA PanCancer Atlas
        const aIsPanCan = a.studyId.includes('pan_can_atlas')
        const bIsPanCan = b.studyId.includes('pan_can_atlas')
        if (aIsPanCan && !bIsPanCan) return -1
        if (!aIsPanCan && bIsPanCan) return 1

        // Then prioritize TCGA
        const aIsTcga = a.studyId.includes('tcga')
        const bIsTcga = b.studyId.includes('tcga')
        if (aIsTcga && !bIsTcga) return -1
        if (!aIsTcga && bIsTcga) return 1

        // Then by sample count
        return b.allSampleCount - a.allSampleCount
      })
  }

  // Fetch all study data concurrently
  async function fetchStudyData(studyId: string) {
    isLoading.value = true
    error.value = null

    try {
      const [
        study,
        clinicalAttributes,
        patientData,
        sampleData,
        molecularProfiles,
        sampleLists,
      ] = await Promise.all([
        fetchStudy(studyId),
        fetchClinicalAttributes(studyId),
        fetchPatientClinicalData(studyId),
        fetchSampleClinicalData(studyId),
        fetchMolecularProfiles(studyId),
        fetchSampleLists(studyId),
      ])

      const patients = transformToPatients(patientData)

      return {
        study,
        clinicalAttributes,
        patients,
        sampleData,
        molecularProfiles,
        sampleLists,
      }
    } catch (e) {
      error.value = 'Failed to fetch study data'
      console.error(e)
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    checkApiHealth,
    fetchStudies,
    fetchStudy,
    fetchClinicalAttributes,
    fetchPatientClinicalData,
    fetchSampleClinicalData,
    fetchMolecularProfiles,
    fetchSampleLists,
    fetchStudyData,
    transformToPatients,
    calculateDistribution,
    calculateAgeHistogram,
    extractSurvivalData,
    filterAndSortStudies,
  }
}
