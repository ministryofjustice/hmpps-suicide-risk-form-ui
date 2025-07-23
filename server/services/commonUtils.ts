import { type Response } from 'express'
import { SuicideRisk } from '../data/suicideRiskApiClient'

export default class CommonUtils {
  constructor() {}

  async redirectRequired(suicideRisk: SuicideRisk, res: Response): Promise<boolean> {
    if (suicideRisk.completedDate != null) {
      res.redirect(`/report-completed/${suicideRisk.id}`)
      return true
    }
    return false
  }
}
