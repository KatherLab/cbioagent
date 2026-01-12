// cBioPortal API Response Types

export interface Study {
  studyId: string
  name: string
  description: string
  publicStudy: boolean
  pmid?: string
  citation?: string
  groups: string
  status: number
  importDate: string
  allSampleCount: number
  readPermission: boolean
  cancerTypeId: string
  referenceGenome: string
}

export interface ClinicalAttribute {
  clinicalAttributeId: string
  displayName: string
  description: string
  datatype: 'STRING' | 'NUMBER'
  patientAttribute: boolean
  priority: string
  studyId: string
}

export interface ClinicalDataItem {
  uniquePatientKey: string
  uniqueSampleKey?: string
  patientId: string
  sampleId?: string
  studyId: string
  clinicalAttributeId: string
  value: string
}

export interface MolecularProfile {
  molecularProfileId: string
  studyId: string
  molecularAlterationType: string
  datatype: string
  name: string
  description: string
  showProfileInAnalysisTab: boolean
}

export interface SampleList {
  sampleListId: string
  studyId: string
  name: string
  description: string
  category: string
  sampleCount: number
}

// Transformed/Aggregated Types for Frontend

export interface Patient {
  patientId: string
  studyId: string
  [key: string]: string | number | undefined
}

export interface PatientData {
  patients: Patient[]
  attributes: ClinicalAttribute[]
}

export interface StudyOverview {
  study: Study
  patientCount: number
  sampleCount: number
  molecularProfiles: MolecularProfile[]
  clinicalAttributes: ClinicalAttribute[]
}

export interface ChartData {
  labels: string[]
  values: number[]
}

export interface SurvivalData {
  patientId: string
  months: number
  status: 'LIVING' | 'DECEASED' | string
}

// API Info response
export interface ApiInfo {
  portalVersion: string
  dbVersion: string
  gitBranch: string
  gitCommitId: string
}
