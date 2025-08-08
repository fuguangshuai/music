import { createI18n } from 'vue-i18n';

import { DEFAULT_LANGUAGE, FALLBACK_LANGUAGE } from './languages';
import { buildLanguageMessages } from './utils';

// 使用工具函数构建语言消息对象
const messages = buildLanguageMessages();

const i18n = createI18n({
  legacy: false, locale: DEFAULT_LANGUAGE,
  fallbackLocale: FALLBACK_LANGUAGE,
  messages: messages as any, // 临时类型断言，避免Vue i18n类型检查问题
  globalInjection: true,
  silentTranslationWarn: true,
  silentFallbackWarn: true,
});

export default i18n;
