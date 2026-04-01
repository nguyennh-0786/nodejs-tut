import { I18nService } from 'nestjs-i18n/dist/services/i18n.service';

export async function t(
  i18nService: I18nService,
  key: string,
  args?: Record<string, unknown>,
): Promise<string> {
  return i18nService.t(key, { args });
}
