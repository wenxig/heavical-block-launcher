import z from 'zod'

export const gameInstanceSchema = z.object({})

export const launcherConfigSchema = z.object({
  theme: z.object({
    primaryColor: z.string(),
    background: z.object({
      like: z
        .object({ type: z.enum(['color']), color: z.string() })
        .or(z.object({ type: z.enum(['image_net']), url: z.string() }))
        .or(z.object({ type: z.enum(['image_local']), path: z.string() })),
      opacity: z.number()
    })
  }),
  log: z.object({ font: z.object({ name: z.string(), size: z.number() }) }),
  download: z.object({ fileNamePatten: z.string(), enabledCache: z.boolean() })
})

export type LauncherConfig = z.infer<typeof launcherConfigSchema>