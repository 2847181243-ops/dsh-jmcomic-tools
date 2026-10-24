/**
 * dsh-jmcomic-tools — 宿主侧入口。
 * 这个包本体是命令行工具（fetch / title）+ 两份 skill；插件壳子只负责让
 * `dsh plugin add dsh-jmcomic-tools` 能装进来、在宿主里被加载。
 */
export const name = 'dsh-jmcomic-tools'

/** 不依赖别的服务。 */
export const inject = []

/** 加载时打印一行，方便在日志里确认装上了。 */
export function apply(ctx) {
  const log = ctx && typeof ctx.logger === 'object' ? ctx.logger : null
  if (log && typeof log.info === 'function') {
    log.info('[dsh-jmcomic-tools] loaded (fetch / title 用 CLI 调，skill 见包内 skills/)')
  }
}
