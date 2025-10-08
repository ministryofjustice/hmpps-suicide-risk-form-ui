import { Router } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import AuditService, { Page } from '../services/auditService'

import SuicideRiskApiClient, { SuicideRisk } from '../data/suicideRiskApiClient'
import CommonUtils from '../services/commonUtils'
import config from '../config'
import ProbationOffenderSearchApiClient, {
  SearchContactResult,
  SearchContactsRequest,
  SearchContactsResponse,
} from '../data/probation-offender-search-api'
import NDeliusIntegrationApiClient, {
  ContactDocSearchResponse,
  DocumentDetails,
} from '../data/ndeliusIntegrationApiClient'
import { ErrorMessages } from '../data/uiModels'
import { handleIntegrationErrors } from '../utils/utils'

export default function treatmentRoutes(
  router: Router,
  auditService: AuditService,
  authenticationClient: AuthenticationClient,
  commonUtils: CommonUtils,
): Router {
  const currentPage = 'treatment'

  router.get('/treatment/:id', async (req, res) => {
    await auditService.logPageView(Page.TREATMENT, { who: res.locals.user.username, correlationId: req.id })
    let suicideRisk: SuicideRisk = null
    const suicideRiskId: string = req.params.id
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    try {
      suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
    } catch (error) {
      const errorMessages: ErrorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
      const showEmbeddedError = true
      res.render(`pages/treatment`, { errorMessages, showEmbeddedError })
      return
    }
    if (await commonUtils.redirectRequired(suicideRisk, suicideRiskId, res, authenticationClient)) return

    res.render('pages/treatment', {
      suicideRisk,
      currentPage,
      suicideRiskId,
    })
  })

  router.post('/treatment/:id', async (req, res) => {
    const suicideRiskId: string = req.params.id
    const suicideRiskApiClient = new SuicideRiskApiClient(authenticationClient)
    const { currentPsychTreatment } = req.body
    const callingScreen: string = req.query.returnTo as string
    let suicideRisk: SuicideRisk = null
    let errorMessages: ErrorMessages = {}

    // Get existing suicide risk record information
    try {
      suicideRisk = await suicideRiskApiClient.getSuicideRiskById(suicideRiskId, res.locals.user.username)
    } catch (error) {
      errorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Suicide Risk')
      const showEmbeddedError = true
      res.render(`pages/treatment`, { errorMessages, showEmbeddedError })
      return
    }

    suicideRisk.currentPsychTreatment = currentPsychTreatment
    suicideRisk.treatmentSaved = true

    // validate notes field
    if (suicideRisk?.currentPsychTreatment?.length > 20000) {
      errorMessages.psychTreatment = {
        text: 'Psychiatric Treatment must be 20000 characters or fewer',
      }
      const showEmbeddedError = true
      res.render(`pages/treatment`, { errorMessages, showEmbeddedError, suicideRisk })
      return
    }

    // When using the 'Search Contacts' button
    if (req.body.action === 'searchContacts') {
      let contactDeeplink: string = null
      let documentsResponse: ContactDocSearchResponse = null
      let searchResults: SearchContactsResponse = null

      const probationOffenderSearchApiClient = new ProbationOffenderSearchApiClient(authenticationClient)
      const request: SearchContactsRequest = {
        crn: suicideRisk.crn,
        query: 'Psychiatric Treatment',
      }
      // Post request to Probation offender search for 'Psychiatric Treatment' related contacts
      try {
        searchResults = await probationOffenderSearchApiClient.searchContacts(request, res.locals.user.username)
        contactDeeplink = `${config.ndeliusDeeplink.url}?component=Contact&CRN=${suicideRisk.crn}&componentId=`
      } catch (error) {
        errorMessages = handleIntegrationErrors(error.status, error.data?.message, 'Probation offender search')
        // take the user to detailed error page for 400 type errors
        if (error.status === 400) {
          res.render(`pages/detailed-error`, { errorMessages })
          return
        }
        // stay on the current page for 500 errors
        if (error.status === 500) {
          const showEmbeddedError = true
          res.render(`pages/treatment`, { errorMessages, showEmbeddedError })
          return
        }
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      // If no contacts found, skip searching for the documents section and render the page
      if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
        res.render('pages/treatment', {
          suicideRiskId,
          suicideRisk,
          currentPage,
          contactDeeplink,
          searchResults,
          errorMessages,
        })
        return
      }

      const ndeliusIntegrationApiClient = new NDeliusIntegrationApiClient(authenticationClient)
      const contactIds = searchResults.results.map(r => r.id)

      // Post request to probation integration to find any documents linked to our contacts
      try {
        documentsResponse = await ndeliusIntegrationApiClient.getDocumentsForContacts(
          contactIds,
          res.locals.user.username,
        )
      } catch (error) {
        errorMessages = handleIntegrationErrors(error.status, error.data?.message, 'NDelius Integration')
        // take the user to detailed error page for 400 type errors
        if (error.status === 400) {
          res.render(`pages/detailed-error`, { errorMessages })
          return
        }
        // stay on the current page for 500 errors
        if (error.status === 500) {
          const showEmbeddedError = true
          res.render(`pages/information`, { errorMessages, showEmbeddedError })
          return
        }
        res.render(`pages/detailed-error`, { errorMessages })
        return
      }

      const docsById = new Map(documentsResponse.content.map(d => [d.id, d.documents]))

      const contactsWithDocs: ContactWithDocuments[] = searchResults.results.map(contact => ({
        contact,
        documents: docsById.get(contact.id) ?? [],
      }))

      res.render('pages/treatment', {
        suicideRiskId,
        suicideRisk,
        currentPage,
        contactDeeplink,
        searchResults,
        contactsWithDocs,
        errorMessages,
      })
    } else {
      await suicideRiskApiClient.updateSuicideRisk(req.params.id, suicideRisk, res.locals.user.username)
      if (req.body.action === 'saveProgressAndClose') {
        res.send(
          `<p>You can now safely close this window</p><script nonce="${res.locals.cspNonce}">window.close()</script>`,
        )
      } else if (callingScreen && callingScreen === 'check-your-report') {
        res.redirect(`/check-your-answers/${req.params.id}`)
      } else {
        res.redirect(`/recipients/${req.params.id}`)
      }
    }
  })

  return router
}

export interface ContactWithDocuments {
  contact: SearchContactResult
  documents: DocumentDetails[]
}
