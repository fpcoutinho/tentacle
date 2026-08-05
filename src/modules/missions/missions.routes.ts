import { Router } from 'express'
import { createMissionCompletion } from './create-mission-completion/create-mission-completion.controller.ts'
import { createMissionSubmission } from './create-mission-submission/create-mission-submission.controller.ts'
import { deleteMissionBookmark } from './delete-mission-bookmark/delete-mission-bookmark.controller.ts'
import { deleteMissionCompletion } from './delete-mission-completion/delete-mission-completion.controller.ts'
import { getMission } from './get-mission/get-mission.controller.ts'
import { getMissionBookmark } from './get-mission-bookmark/get-mission-bookmark.controller.ts'
import { upsertMissionBookmark } from './upsert-mission-bookmark/upsert-mission-bookmark.controller.ts'

export const missionsRouter = Router()

missionsRouter.get('/:slug', getMission)
missionsRouter.post('/:slug/questions/:questionSlug/submissions', createMissionSubmission)
missionsRouter.post('/:slug/completions', createMissionCompletion)
missionsRouter.delete('/:slug/completions', deleteMissionCompletion)
missionsRouter.get('/:slug/bookmark', getMissionBookmark)
missionsRouter.put('/:slug/bookmark', upsertMissionBookmark)
missionsRouter.delete('/:slug/bookmark', deleteMissionBookmark)
